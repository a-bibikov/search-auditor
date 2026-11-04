import { fetchUrl, isSameSite, pool, type Fetched, type Origins, type Site } from "ai-search-auditor";
import { norm } from "./rules/util.ts";
import type { Probe, SeoExtras, SeoSite } from "./types.ts";

export interface CollectOptions {
  maxLinks: number;
  concurrency?: number;
  log?: (line: string) => void;
}

const probeOf = (f: Fetched, from?: string): Probe => ({
  status: f.status,
  redirected: Boolean(f.redirected),
  finalUrl: f.finalUrl ?? f.publicUrl,
  ...(f.error ? { error: f.error } : {}),
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

  const firstSeen = new Map<string, string>();
  for (const p of site.pages)
    for (const href of p.links)
      if (isSameSite(href, o) && isPageLike(href) && !firstSeen.has(norm(href))) firstSeen.set(norm(href), p.fetched.publicUrl);
  const linkTargets = [...firstSeen.keys()].filter((u) => !known.has(u));
  const toCheck = linkTargets.slice(0, opts.maxLinks);

  log(`${canonicalTargets.length} canonical targets, ${toCheck.length} of ${firstSeen.size} internal links`);
  const light = { maxBytes: 65_536, timeoutMs: 10_000 };
  const [probe404, httpHome, canonicals, linked] = await Promise.all([
    fetchUrl(`${site.target}/__search-auditor-${Math.random().toString(36).slice(2, 10)}`, o, light),
    !local && site.base.startsWith("https://") ? fetchUrl(`http://${new URL(site.base).host}/`, o, light) : Promise.resolve(null),
    pool(canonicalTargets, conc, (u) => fetchUrl(u, o, light)),
    pool(toCheck, conc, (u) => fetchUrl(u, o, light)),
  ]);

  const links = new Map<string, Probe>();
  for (const [url, from] of firstSeen) {
    const done = known.get(url);
    if (done) links.set(url, { ...done, from });
  }
  toCheck.forEach((url, i) => links.set(url, probeOf(linked[i]!, firstSeen.get(url))));

  const seo: SeoExtras = {
    local,
    probe404,
    httpHome,
    canonicals: new Map(canonicalTargets.map((u, i) => [norm(u), probeOf(canonicals[i]!)])),
    links,
    linksFound: firstSeen.size,
    linksChecked: links.size,
  };
  return Object.assign(site, { seo });
}

export const seoOf = (site: Site) => (site as SeoSite).seo;
