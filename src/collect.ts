import { fetchUrl, isSameSite, parsePage, parseSitemap, pool, type Fetched, type Origins, type Site } from "auditor-engine";
import { norm } from "./rules/util.ts";
import { certificateOf, firstHop, timeToFirstByte, trace } from "./trace.ts";
import type { Chain, Probe, SeoExtras, SeoSite, SitemapFile } from "./types.ts";

/** Redirecting addresses followed hop by hop per run: enough to show a pattern without a request storm. */
const MAX_CHAINS = 20;
/** Requests to time the home page: the median of three smooths out one slow answer. */
const TTFB_SAMPLES = 3;

/** The same host with www. added or removed. */
const otherHostOf = (base: string) => {
  const u = new URL(base);
  u.hostname = u.hostname.startsWith("www.") ? u.hostname.slice(4) : `www.${u.hostname}`;
  return `${u.origin}/`;
};

/** Parameters every campaign link adds: the page must still name its clean address as canonical. */
export const UTM = "utm_source=search-auditor&utm_medium=audit";

/** Absolute canonical of a fetched page, or "" when it has none or it does not parse. */
const canonicalOf = (f: Fetched) => {
  if (f.status !== 200) return "";
  const href = parsePage(f).canonical;
  try {
    return href ? new URL(href, f.publicUrl).href : "";
  } catch {
    return "";
  }
};

/** The <head> of a page: up to </head>, or up to <body> when the closing tag is left out. */
export const headOf = (html: string) => {
  const end = html.search(/<\/head\s*>|<body[\s>]/i);
  return end < 0 ? html : html.slice(0, end);
};

/** Sitemap addresses outside the sample requested per run: enough to catch a pattern of dead pages. */
const MAX_SITEMAP_EXTRA = 50;
/** Images of the site requested per run: enough to catch broken and heavy ones. */
const MAX_IMAGES = 30;

/** Links to other sites requested per run: enough to catch dead ones without crawling the web. */
const MAX_EXTERNAL = 30;

/** Child sitemaps of an index requested per run. */
const MAX_SITEMAP_CHILDREN = 10;
/** The sitemap protocol's limits per file: 50,000 addresses and 50 MB uncompressed. Read a little past them. */
const SITEMAP_MAX_BYTES = 52 * 1024 * 1024;

/** What a sitemap file is and how it breaks the format, from its raw body. */
function sitemapFileOf(url: string, source: SitemapFile["source"], f: Fetched): SitemapFile {
  const body = f.body;
  const kind: SitemapFile["kind"] = /\.gz(\?|$)/i.test(url) && !/<(urlset|sitemapindex)\b/i.test(body)
    ? "gzip"
    : /<sitemapindex\b/i.test(body)
      ? "index"
      : /<urlset\b/i.test(body)
        ? "urlset"
        : /^\s*<(!doctype html|html)/i.test(body)
          ? "html"
          : "other";
  const count = (body.match(kind === "index" ? /<sitemap\b/gi : /<url\b/gi) ?? []).length;
  const badAmpersands = [...body.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].filter((m) => /&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/i.test(m[1]!)).length;
  return { url: f.publicUrl, source, status: f.status, ...(f.error ? { error: f.error } : {}), kind, bytes: Buffer.byteLength(body), count, badAmpersands };
}

/** A sampled page whose address can be asked with the trailing slash toggled: not the home page, not a file. */
const slashCandidate = (site: Site) =>
  site.pages.find((p) => {
    const path = new URL(p.fetched.publicUrl).pathname;
    return path !== "/" && !/\.[a-z0-9]{2,5}$/i.test(path) && !p.fetched.redirected;
  });

export interface CollectOptions {
  maxLinks: number;
  concurrency?: number;
  log?: (line: string) => void;
}

const probeOf = (f: Fetched, from?: string[]): Probe => ({
  status: f.status,
  redirected: Boolean(f.redirected),
  finalUrl: f.finalUrl ?? f.publicUrl,
  html: /text\/html|application\/xhtml/i.test(f.headers.get("content-type") ?? ""),
  noindex: f.status === 200 && /\b(noindex|none)\b/i.test(`${f.headers.get("x-robots-tag") ?? ""} ${f.body.match(/<meta[^>]+name=["']?robots["']?[^>]*>/i)?.[0] ?? ""}`),
  ...(f.error ? { error: f.error } : {}),
  ...(Number(f.headers.get("content-length")) > 0 ? { bytes: Number(f.headers.get("content-length")) } : {}),
  ...(from ? { from } : {}),
});

/** Links worth requesting: pages, not files a crawler would not index anyway. */
const isPageLike = (url: string) => !/\.(png|jpe?g|gif|webp|avif|svg|ico|css|js|mjs|map|woff2?|ttf|otf|mp4|webm|mp3|zip|gz)(\?|$)/i.test(new URL(url).pathname);

/**
 * Extra requests for the SEO checks, in the same run as the shared crawl: a made-up URL that must answer 404,
 * canonical targets outside the sample, internal links (capped by maxLinks) and, for a live https site,
 * the home page over plain http://.
 */
export async function collect(site: Site, opts: CollectOptions): Promise<SeoSite> {
  const o: Origins = { target: site.target, base: site.base };
  const conc = opts.concurrency ?? 6;
  const log = opts.log ?? (() => {});
  // A local build (--base) or a dev server: HTTPS and the http:// redirect are the live site's business.
  const local = site.target !== site.base || /^(localhost|127\.\d+\.\d+\.\d+|\[::1\])$/.test(new URL(site.base).hostname);

  // Everything the crawl already requested, so nothing is fetched twice.
  const known = new Map<string, Probe>();
  for (const p of site.pages) known.set(norm(p.fetched.publicUrl), probeOf(p.fetched));
  for (const f of site.failed) known.set(norm(f.publicUrl), probeOf(f));

  const canonicalTargets = [
    ...new Set(
      site.pages
        .map((p) => {
          try {
            return p.canonical ? new URL(p.canonical, p.fetched.publicUrl).href : "";
          } catch {
            return "";
          }
        })
        .filter((u) => u && isSameSite(u, o) && !known.has(norm(u))),
    ),
  ].slice(0, 20);

  // Every audited page that links to each address: a broken link is fixed on the pages that have it.
  const linkedFrom = new Map<string, string[]>();
  for (const p of site.pages)
    for (const href of p.links)
      if (isSameSite(href, o) && isPageLike(href)) {
        const list = linkedFrom.get(norm(href)) ?? [];
        if (!list.includes(p.fetched.publicUrl)) linkedFrom.set(norm(href), [...list, p.fetched.publicUrl]);
      }
  const linkTargets = [...linkedFrom.keys()].filter((u) => !known.has(u));
  const toCheck = linkTargets.slice(0, opts.maxLinks);

  log(`${canonicalTargets.length} canonical targets, ${toCheck.length} of ${linkedFrom.size} internal links`);
  const light = { maxBytes: 65_536, timeoutMs: 10_000 };
  const slashPage = slashCandidate(site);
  const slashUrl = slashPage ? slashPage.fetched.publicUrl.replace(/\/?$/, (m) => (m ? "" : "/")) : null;
  const liveHttps = !local && site.base.startsWith("https://");
  const utmPage = site.pages.find((p) => new URL(p.fetched.publicUrl).pathname === "/" && !p.fetched.publicUrl.includes("?")) ?? site.pages[0];
  const utmUrl = utmPage ? `${utmPage.fetched.publicUrl}${utmPage.fetched.publicUrl.includes("?") ? "&" : "?"}${UTM}` : null;
  const host = new URL(site.base).hostname;
  // The icon search results show next to the address: declared in <head>, or /favicon.ico by convention.
  const declaresIcon = utmPage ? /<link\b[^>]*\brel\s*=\s*["']?[^"'>]*\bicon\b/i.test(headOf(utmPage.fetched.body)) : true;
  const [probe404, httpHome, canonicals, linked, robotsRaw, otherHost, slashFetched, ttfb, httpHop, cert, utmFetched, favicon] = await Promise.all([
    fetchUrl(`${site.target}/__search-auditor-${Math.random().toString(36).slice(2, 10)}`, o, light),
    !local && site.base.startsWith("https://") ? fetchUrl(`http://${new URL(site.base).host}/`, o, light) : Promise.resolve(null),
    pool(canonicalTargets, conc, (u) => fetchUrl(u, o, light)),
    pool(toCheck, conc, (u) => fetchUrl(u, o, light)),
    // Up to 600 KB: enough to tell a robots.txt over Google's 500 KB limit.
    fetchUrl(`${site.base}/robots.txt`, o, { accept: "text/plain", maxBytes: 614_400, timeoutMs: 10_000 }),
    local ? Promise.resolve(null) : fetchUrl(otherHostOf(site.base), { target: otherHostOf(site.base).slice(0, -1), base: otherHostOf(site.base).slice(0, -1) }, light),
    slashUrl ? fetchUrl(slashUrl, o, light) : Promise.resolve(null),
    local ? Promise.resolve(null) : (async () => {
      const times: number[] = [];
      for (let i = 0; i < TTFB_SAMPLES; i++) {
        const ms = await timeToFirstByte(`${site.base}/`, o);
        if (ms !== null) times.push(ms);
      }
      return times.length ? times : null;
    })(),
    liveHttps ? firstHop(`http://${new URL(site.base).host}/`) : Promise.resolve(null),
    liveHttps ? certificateOf(host) : Promise.resolve(null),
    utmUrl ? fetchUrl(utmUrl, o, light) : Promise.resolve(null),
    declaresIcon ? Promise.resolve(null) : fetchUrl(`${site.base}/favicon.ico`, o, { ...light, accept: "image/*" }),
  ]);

  const links = new Map<string, Probe>();
  for (const [url, from] of linkedFrom) {
    const done = known.get(url);
    if (done) links.set(url, { ...done, from });
  }
  toCheck.forEach((url, i) => links.set(url, probeOf(linked[i]!, linkedFrom.get(url))));

  // Every address known to redirect, with the pages that point at it: sampled pages, links, canonicals, sitemap.
  const redirecting = new Map<string, string[]>();
  const note = (url: string, from: string[]) => redirecting.set(url, [...new Set([...(redirecting.get(url) ?? []), ...from])]);
  const listed = new Set((site.sitemap?.urls ?? []).map((u) => norm(u.loc)));
  for (const f of [...site.pages.map((p) => p.fetched), ...site.failed])
    if (f.redirected && f.finalUrl && norm(f.finalUrl) !== norm(f.publicUrl)) note(f.publicUrl, listed.has(norm(f.publicUrl)) ? ["sitemap.xml"] : []);
  // A link that failed without an answer may be a redirect loop: fetch gives up on those without saying so.
  for (const [url, p] of links) if ((p.redirected && norm(p.finalUrl) !== norm(url)) || p.status === 0) note(url, p.from ?? []);
  if (httpHome?.redirected) note(httpHome.publicUrl, []);
  const toTrace = [...redirecting.keys()].slice(0, MAX_CHAINS);
  const traced = await pool(toTrace, conc, (u) => trace(u, o));
  const chains: Chain[] = toTrace.map((url, i) => ({ url, ...traced[i]!, from: redirecting.get(url) ?? [] }));

  // The sitemap files as robots.txt declares them (or the default address), then the children of an index.
  const declared = robotsRaw.status === 200 ? [...robotsRaw.body.matchAll(/^\s*sitemap\s*:\s*(\S+)/gim)].map((m) => m[1]!) : [];
  const roots: { url: string; source: SitemapFile["source"] }[] = declared.length
    ? [...new Set(declared)].slice(0, 5).map((url) => ({ url, source: "robots" }))
    : [{ url: `${site.base}/sitemap.xml`, source: "default" }];
  const xml = { accept: "application/xml,text/xml", maxBytes: SITEMAP_MAX_BYTES, timeoutMs: 20_000 };
  const rootFetched = await pool(roots, conc, (r) => fetchUrl(r.url, o, xml));
  const sitemapFiles = roots.map((r, i) => sitemapFileOf(r.url, r.source, rootFetched[i]!));
  const childUrls = rootFetched.flatMap((f) => (f.status === 200 ? parseSitemap(f.body).children : [])).slice(0, MAX_SITEMAP_CHILDREN);
  const childFetched = await pool(childUrls, conc, (u) => fetchUrl(u, o, xml));
  sitemapFiles.push(...childUrls.map((u, i) => sitemapFileOf(u, "index", childFetched[i]!)));

  // Sitemap addresses the crawl did not sample: do they answer at all?
  const extraUrls = (site.sitemap?.urls ?? [])
    .map((u) => u.loc)
    .filter((u) => isSameSite(u, o) && !known.has(norm(u)))
    .slice(0, MAX_SITEMAP_EXTRA);
  const extraFetched = await pool(extraUrls, conc, (u) => fetchUrl(u, o, light));
  const sitemapExtra = new Map(extraUrls.map((u, i) => [norm(u), probeOf(extraFetched[i]!)]));

  // Links to other sites, with the pages that have them: do they still exist?
  const externalFrom = new Map<string, string[]>();
  for (const p of site.pages)
    for (const href of p.links)
      if (/^https?:\/\//i.test(href) && !isSameSite(href, o)) externalFrom.set(href, [...new Set([...(externalFrom.get(href) ?? []), p.fetched.publicUrl])]);
  const externalUrls = [...externalFrom.keys()].slice(0, MAX_EXTERNAL);
  const externalFetched = await pool(externalUrls, conc, (u) => fetchUrl(u, o, { maxBytes: 16_384, timeoutMs: 8_000 }));
  const external = new Map(externalUrls.map((u, i) => [u, probeOf(externalFetched[i]!, externalFrom.get(u))]));

  // Images of this site, with the pages that use them. Only the headers matter: status and Content-Length.
  const imageFrom = new Map<string, string[]>();
  for (const p of site.pages)
    for (const img of p.images)
      if (img.src && isSameSite(img.src, o) && !img.src.startsWith("data:")) imageFrom.set(img.src, [...new Set([...(imageFrom.get(img.src) ?? []), p.fetched.publicUrl])]);
  const imageUrls = [...imageFrom.keys()].slice(0, MAX_IMAGES);
  const imageFetched = await pool(imageUrls, conc, (u) => fetchUrl(u, o, { maxBytes: 1024, timeoutMs: 10_000, accept: "image/avif,image/webp,image/*" }));
  const images = new Map(imageUrls.map((u, i) => [u, probeOf(imageFetched[i]!, imageFrom.get(u))]));

  const slashParsed = slashFetched && slashFetched.status === 200 ? parsePage(slashFetched) : null;
  const abs = (href: string, base: string) => {
    try {
      return href ? new URL(href, base).href : "";
    } catch {
      return "";
    }
  };

  const seo: SeoExtras = {
    local,
    probe404,
    httpHome,
    canonicals: new Map(canonicalTargets.map((u, i) => [norm(u), { ...probeOf(canonicals[i]!), canonical: canonicalOf(canonicals[i]!) }])),
    links,
    linksFound: linkedFrom.size,
    linksChecked: links.size,
    robotsRaw,
    otherHost,
    slashVariant:
      slashPage && slashUrl && slashFetched
        ? {
            main: slashPage.fetched.publicUrl,
            mainCanonical: abs(slashPage.canonical, slashPage.fetched.publicUrl),
            variant: slashUrl,
            fetched: slashFetched,
            canonical: slashParsed ? abs(slashParsed.canonical, slashUrl) : "",
          }
        : null,
    chains,
    ttfb,
    httpHop,
    cert,
    sitemapFiles,
    sitemapExtra,
    favicon,
    external,
    images,
    utm: utmPage && utmUrl && utmFetched ? { page: utmPage.fetched.publicUrl, url: utmUrl, status: utmFetched.status, canonical: canonicalOf(utmFetched) } : null,
  };
  return Object.assign(site, { seo });
}

export const seoOf = (site: Site) => (site as SeoSite).seo;
