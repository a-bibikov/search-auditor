import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { toMarkdown } from "auditor-engine";
import { auditSearch, seoRules, type Report } from "../src/index.ts";
import { DESCRIPTION, html, redirect, serve, words, type Routes } from "./site.ts";

const fired = (r: Report) => new Set(r.findings.map((f) => f.rule));
const seoIds = seoRules.map((r) => r.id);
const skipped = (r: Report) => new Set(r.rules.filter((x) => x.skipped).map((x) => x.id));

/** A site that does everything right: the SEO checks must stay silent. */
const goodSite = (o: string): Routes => {
  const langs = `<link rel="alternate" hreflang="en" href="${o}/"><link rel="alternate" hreflang="ru" href="${o}/ru/"><link rel="alternate" hreflang="x-default" href="${o}/">`;
  const ld = `<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Person","name":"Ada Example"},{"@type":"WebSite","name":"Ada Example","url":"${o}/"}]}</script>`;
  return {
    "/robots.txt": { type: "text/plain", body: `User-agent: *\nAllow: /\n\nSitemap: ${o}/sitemap.xml\n` },
    "/me.webp": { type: "image/webp", body: "RIFF" },
    "/line.svg": { type: "image/svg+xml", body: "<svg xmlns='http://www.w3.org/2000/svg'/>" },
    "/sitemap.xml": { type: "application/xml", body: `<urlset><url><loc>${o}/</loc></url><url><loc>${o}/ru/</loc></url><url><loc>${o}/blog/post</loc></url><url><loc>${o}/about</loc></url></urlset>` },
    "/": {
      body: html({
        title: "Ada Example: engineer and writer",
        description: DESCRIPTION,
        canonical: `${o}/`,
        head: langs + ld,
        body: `<h1>Ada Example</h1><h2>Work</h2><h3>Projects</h3><p>${words(80)}</p><img src="/me.webp" alt="Ada at work" width="640" height="480"><img src="/line.svg" alt="" width="10" height="1"><a href="/blog/post">Post</a> <a href="/ru/">RU</a> <a href="/about">About</a>`,
      }),
    },
    "/ru/": { body: html({ lang: "ru", title: "Ада Пример: инженер и автор", description: `Русская версия. ${DESCRIPTION}`, canonical: `${o}/ru/`, head: langs, body: `<h1>Ада Пример</h1><p>${words(80, "ответ")}</p>` }) },
    "/blog/post": { body: html({ title: "How answers work", description: `About answers. ${DESCRIPTION}`, canonical: `${o}/blog/post`, head: `<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Blog","item":"${o}/blog"},{"@type":"ListItem","position":2,"name":"How answers work"}]}</script>`, body: `<h1>How answers work</h1><h2>Why</h2><p>${words(120)}</p>` }) },
    "/about": { body: html({ title: "About Ada Example", description: `About. ${DESCRIPTION}`, canonical: `${o}/about`, body: `<h1>About</h1>` }) },
  };
};

/** One mistake or more per rule. */
const badSite = (o: string, ext = "http://127.0.0.1:9"): Routes => ({
  "/robots.txt": { type: "text/plain", body: `User-agent: *\nAllow: /\nDisallow: /blocked\nDisallow: /assets/\nCrawl delay 10\n` },
  "/sitemap.xml": {
    type: "application/xml",
    body: `<urlset>${["/", "/blocked", "/hidden", "/badlinks", "/images", "/below", "/schema", "/shop/item", "/langs", "/logo-h1", "/offtopic", "/nozoom", "/wronglang", "/quirks", "/home-title", "/twotitles", "/echo", "/nosnippet", "/twocanon", "/bodycanon", "/headercanon", "/chain-a", "/ru-copy", "/moved", "/gone", "/soft", "/nocanon", "/relcanon", "/foreign", "/deadcanon", "/redircanon", "/dup-one", "/dup-two", "/jsonbad", "/ru-one", "/long"].map((p) => `<url><loc>${o}${p}</loc></url>`).join("")}` +
      // A bare &, a relative and a foreign address, a date in the future and one that is not a date.
      `<url><loc>${o}/search?q=a&b=c</loc></url><url><loc>/relative-page</loc></url><url><loc>https://other.example/page</loc></url>` +
      `<url><loc>${o}/soft</loc><lastmod>2099-01-01</lastmod></url><url><loc>${o}/long</loc><lastmod>yesterday</lastmod></url></urlset>`,
  },
  "/": {
    body: html({
      icon: false,
      title: "Bad example site home",
      description: DESCRIPTION,
      canonical: `${o}/`,
      head: `<link rel="alternate" hreflang="en" href="${o}/"><link rel="alternate" hreflang="ru" href="${o}/ru-one"><link rel="alternate" hreflang="english" href="${o}/"><link rel="stylesheet" href="/assets/app.css">`,
      body: `<h1>Home</h1><img src="/photo.jpg"><a href="/broken">Broken</a> <a href="/moved">Moved</a> <a href="/hop-one">Hops</a> <a href="/loop-a">Loop</a> <a href="/target">Not in the sitemap</a> <a href="/feed.xml">Feed</a> <a href="/closed">Closed</a>`,
    }),
  },
  "/blocked": { body: html({ title: "Blocked by robots.txt", description: `Blocked. ${DESCRIPTION}`, canonical: `${o}/blocked`, body: "<h1>Blocked</h1>" }) },
  "/hidden": { body: html({ title: "Hidden with noindex page", description: `Hidden. ${DESCRIPTION}`, canonical: `${o}/target`, head: `<meta name="robots" content="noindex">`, body: "<h1>Hidden</h1>" }) },
  // No charset anywhere: neither in <meta> nor in the Content-Type header.
  // Links a crawler cannot follow, nofollow on the site's own page, texts that say nothing, and a dead outbound link.
  "/badlinks": {
    body: html({
      title: "Links that do not work well",
      description: `Links. ${DESCRIPTION}`,
      canonical: `${o}/badlinks`,
      body: `<h1>Links</h1><a>No href</a> <a href="#">Menu</a> <a href="javascript:void(0)">Open</a> <a name="anchor"></a>
        <a href="/target" rel="nofollow">Target</a> <a href="/target">Read more →</a> <a href="/target"><img src="/x.png"></a>
        <a href="/target" aria-label="Target page"><svg></svg></a> <a href="#section">Skip to the section</a>
        <a href="${ext}/gone">Gone</a> <a href="${ext}/alive">Alive</a> <a href="${ext}/blocked">Blocked</a>`,
    }),
  },
  // The first image lazy, JPEG only, a file name for alt and no size; one that is missing; one that is too heavy.
  "/images": {
    body: html({
      title: "Images that slow the page",
      description: `Images. ${DESCRIPTION}`,
      canonical: `${o}/images`,
      body: `<h1>Images</h1><img src="/big.jpg" alt="IMG_1234.jpg" loading="lazy"><img src="/missing.png" alt="Chart of results" width="100" height="50">
        <picture><source type="image/avif" srcset="/ok.avif"><img src="/ok.jpg" alt="A modern photo" width="10" height="10"></picture>`,
    }),
  },
  // A long text first, then a lazy image: it is below the first screen, and lazy is right there.
  "/below": {
    body: html({
      title: "A lazy image far down the page",
      description: `Below. ${DESCRIPTION}`,
      canonical: `${o}/below`,
      body: `<h1>Below</h1><p>${words(250)}</p><img src="/ok.jpg?w=10&amp;h=10" alt="A photo below" width="10" height="10" loading="lazy">`,
    }),
  },
  // A static file server sends its size; the fixture server would stream it in chunks without one.
  "/big.jpg": { type: "image/jpeg", body: "x".repeat(600 * 1024), headers: { "content-length": String(600 * 1024) } },
  "/ok.jpg": { type: "image/jpeg", body: "x" },
  // No @context, an entity without @type, a Product with nothing to show, an Event without a date or place,
  // a breadcrumb item without a position, a relative logo and a date written the local way.
  "/schema": {
    body: html({
      title: "Structured data with gaps",
      description: `Schema. ${DESCRIPTION}`,
      canonical: `${o}/schema`,
      head: `<script type="application/ld+json">{"@type":"Organization","name":"Shop","logo":"/logo.png"}</script>
        <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"name":"No type"},{"@id":"${o}/#org"},
          {"@type":"Product","name":"Kettle"},{"@type":"Event","name":"Launch","startDate":"05.11.2026"},
          {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","name":"Shop"}]}]}</script>`,
      body: "<h1>Schema</h1>",
    }),
  },
  "/shop/item": { body: html({ title: "An item deep in the shop", description: `Item. ${DESCRIPTION}`, canonical: `${o}/shop/item`, body: "<h1>Item</h1>" }) },
  // A language set without the page itself, a version whose canonical is elsewhere, a dead one, «en» twice and a
  // relative address.
  "/langs": {
    body: html({
      title: "Language links with mistakes",
      description: `Langs. ${DESCRIPTION}`,
      canonical: `${o}/langs`,
      head: `<link rel="alternate" hreflang="ru" href="${o}/ru-copy"><link rel="alternate" hreflang="de" href="${o}/gone">
        <link rel="alternate" hreflang="en" href="${o}/target"><link rel="alternate" hreflang="en" href="${o}/long">
        <link rel="alternate" hreflang="fr" href="/relative-fr">`,
      body: "<h1>Langs</h1>",
    }),
  },
  "/logo-h1": { body: html({ title: "Logo instead of a heading", description: `Logo. ${DESCRIPTION}`, canonical: `${o}/logo-h1`, body: '<h1><img src="/logo.png" alt="Logo"></h1><h2></h2><p>Text</p>' }) },
  "/offtopic": { body: html({ title: "Pricing for teams and companies", description: `Pricing. ${DESCRIPTION}`, canonical: `${o}/offtopic`, body: "<h1>Welcome to our blog</h1>" }) },
  "/nozoom": { body: html({ title: "Zoom is blocked on this page", description: `Zoom. ${DESCRIPTION}`, canonical: `${o}/nozoom`, viewport: false, head: '<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">', body: "<h1>Zoom</h1>" }) },
  "/wronglang": { body: html({ title: "Declared English, written in Russian", description: `Lang. ${DESCRIPTION}`, canonical: `${o}/wronglang`, body: `<h1>Язык</h1><p>${words(60, "страница")}</p>` }) },
  // No doctype and no <main>: an old template.
  "/quirks": {
    body: `<html lang="en"><head><meta charset="utf-8"><title>An old template without doctype</title><meta name="description" content="Quirks. ${DESCRIPTION}"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="canonical" href="${o}/quirks"></head><body><div><h1>An old template</h1></div></body></html>`,
  },
  "/home-title": { type: "text/html", body: html({ title: "Home", description: `Generic. ${DESCRIPTION}`, canonical: `${o}/home-title`, charset: false, body: "<h1>Home</h1>" }) },
  "/twotitles": { body: html({ title: "First title of the page", description: `Two titles. ${DESCRIPTION}`, canonical: `${o}/twotitles`, head: `<title>Second title of the page</title><meta name="description" content="Another description">`, body: '<h1>Titles</h1><svg><title>An icon title is fine</title></svg>' }) },
  "/echo": { body: html({ title: "A description that only echoes", description: "A description that only echoes.", canonical: `${o}/echo`, body: "<h1>Echo</h1>" }) },
  "/nosnippet": { body: html({ title: "Snippet is forbidden here", description: `No snippet. ${DESCRIPTION}`, canonical: `${o}/nosnippet`, head: `<meta name="robots" content="max-snippet:0">`, body: "<h1>No snippet</h1>" }) },
  "/twocanon": { body: html({ title: "Two canonicals on a page", description: `Two. ${DESCRIPTION}`, canonical: `${o}/twocanon`, head: `<link rel="canonical" href="${o}/target">`, body: "<h1>Two</h1>" }) },
  "/bodycanon": { body: html({ title: "Canonical in the body", description: `Body. ${DESCRIPTION}`, body: `<h1>Body</h1><link rel="canonical" href="${o}/bodycanon">` }) },
  "/headercanon": {
    body: html({ title: "Canonical header conflict", description: `Header. ${DESCRIPTION}`, canonical: `${o}/headercanon`, body: "<h1>Header</h1>" }),
    headers: { link: `<${o}/target>; rel="canonical"` },
  },
  "/chain-a": { body: html({ title: "First page of a chain", description: `Chain. ${DESCRIPTION}`, canonical: `${o}/chain-b`, body: "<h1>A</h1>" }) },
  "/chain-b": { body: html({ title: "Second page of a chain", description: `Chain b. ${DESCRIPTION}`, canonical: `${o}/target`, body: "<h1>B</h1>" }) },
  "/ru-copy": { body: html({ lang: "ru", title: "Русская копия главной", description: `Копия. ${DESCRIPTION}`, canonical: `${o}/`, body: "<h1>Копия</h1>" }) },
  // The home page asked with UTM tags copies them into its canonical, as a template that uses the request URL does.
  "/?utm_source=search-auditor&utm_medium=audit": {
    body: html({ title: "Bad example site home", description: DESCRIPTION, canonical: `${o}/?utm_source=search-auditor&utm_medium=audit`, body: "<h1>Home</h1>" }),
  },
  "/feed.xml": { type: "application/rss+xml", body: "<rss></rss>" },
  "/closed": { body: html({ title: "Closed with noindex", description: `Closed. ${DESCRIPTION}`, head: `<meta name="robots" content="noindex">`, body: "<h1>Closed</h1>" }) },
  "/hop-one": redirect("/hop-two"),
  "/hop-two": redirect("/target"),
  "/loop-a": redirect("/loop-b"),
  "/loop-b": redirect("/loop-a"),
  "/assets/app.css": { type: "text/css", body: "body{}" },
  "/moved": redirect("/target"),
  "/old": redirect("/target"),
  "/target": { body: html({ title: "The target page here", description: `Target. ${DESCRIPTION}`, canonical: `${o}/target`, body: "<h1>Target</h1>" }) },
  "/gone": { status: 404, body: "<h1>Gone</h1>" },
  "/soft": { body: html({ title: "Page not found", description: `Soft. ${DESCRIPTION}`, canonical: `${o}/soft`, body: "<h1>Page not found</h1>" }) },
  "/nocanon": { body: html({ title: null, lang: null, viewport: false, body: `<p>${words(40)}</p>` }) },
  "/relcanon": { body: html({ title: "Relative canonical page", description: `Rel. ${DESCRIPTION}`, canonical: "/relcanon", body: "<h1>One</h1><h1>Two</h1><h3>Skipped a level</h3>" }) },
  "/foreign": { body: html({ title: "Foreign canonical page", description: `Foreign. ${DESCRIPTION}`, canonical: "https://other.example/foreign", body: "<h1>Foreign</h1>" }) },
  "/deadcanon": { body: html({ title: "Dead canonical page", description: `Dead. ${DESCRIPTION}`, canonical: `${o}/dead`, body: "<h1>Dead</h1>" }) },
  "/redircanon": { body: html({ title: "Redirecting canonical", description: `Redir. ${DESCRIPTION}`, canonical: `${o}/old`, body: "<h1>Redir</h1>" }) },
  "/dup-one": { body: html({ title: "Same title twice", description: DESCRIPTION.replace("A ", "The "), canonical: `${o}/dup-one`, body: "<h1>Dup one</h1>" }) },
  "/dup-two": { body: html({ title: "Same title twice", description: DESCRIPTION.replace("A ", "The "), canonical: `${o}/dup-two`, body: "<h1>Dup two</h1>" }) },
  "/jsonbad": { body: html({ title: "Broken structured data", description: `Json. ${DESCRIPTION}`, canonical: `${o}/jsonbad`, head: `<script type="application/ld+json">{"@type": "Person",}</script>`, body: "<h1>Json</h1>" }) },
  "/ru-one": { body: html({ lang: "ru", title: "Русская страница сайта", description: `Ру. ${DESCRIPTION}`, canonical: `${o}/ru-one`, body: "<h1>Ру</h1>" }) },
  "/long": { body: html({ title: "A title that goes on and on well past the sixty characters a result shows", description: "Too short.", canonical: `${o}/long`, body: "<h1>Long</h1>" }) },
});

describe("classic search checks", () => {
  let good: Report;
  let bad: Report;
  const closers: (() => Promise<void>)[] = [];
  before(async () => {
    // Routes need the origin, the origin needs a server: start, then fill the routes in place.
    const goodRoutes: Routes = {};
    const s1 = await serve(goodRoutes);
    Object.assign(goodRoutes, goodSite(s1.origin));
    // Another site for the outbound links: one page gone, one alive, one that turns bots away with 403.
    const ext = await serve({ "/alive": { body: "<h1>Alive</h1>" }, "/blocked": { status: 403, body: "no bots" } });
    closers.push(ext.close);
    const badRoutes: Routes = {};
    // The bad site answers 200 for made-up addresses, and for any page with a trailing slash added, with a canonical
    // built from the requested address: a common way to end up with two copies of every page.
    const s2 = await serve(badRoutes, (path) => {
      if (path.startsWith("/__search-auditor-")) return { body: html({ title: "Home", body: "<h1>Home</h1>" }) };
      if (path.length > 1 && path.endsWith("/") && badRoutes[path.slice(0, -1)]?.body)
        return { body: html({ title: "Trailing slash copy", canonical: `${s2.origin}${path}`, body: "<h1>Copy</h1>" }) };
      return undefined;
    });
    Object.assign(badRoutes, badSite(s2.origin, ext.origin));
    closers.push(s1.close, s2.close);
    good = await auditSearch(s1.origin, {});
    // Every page of the bad site: each one carries a mistake a check must find.
    bad = await auditSearch(s2.origin, { config: { maxPages: "all" } });
  });
  after(async () => {
    for (const c of closers) await c();
  });

  it("stays silent on a site that does everything right", () => {
    assert.deepEqual(good.findings, []);
    assert.equal(good.score, 100);
  });

  it("does not check HTTPS on a local server", () => {
    assert.ok(skipped(good).has("SEC-1") && skipped(good).has("SEC-2"));
  });

  it("runs the language checks when there is hreflang", () => {
    for (const id of ["LANG-1", "LANG-2", "LANG-3", "IMG-1", "DATA-1"]) assert.ok(!skipped(good).has(id), id);
  });

  it("finds every mistake on a bad site", () => {
    // HTTPS and server speed mean nothing on a local server: they are covered by the unit tests.
    // MAP-7 needs sitemap addresses beyond the sample: its own site below audits only part of the sitemap.
    const missing = seoIds.filter((id) => !id.startsWith("SEC-") && !["IDX-9", "MAP-7"].includes(id) && !fired(bad).has(id));
    assert.deepEqual(missing, []);
  });

  it("checks the structured data: context and type, required properties, breadcrumbs, formats, site name", () => {
    const msg = (rule: string) => bad.findings.filter((f) => f.rule === rule).map((f) => `${f.where.replace(bad.site, "")} ${f.message}`);
    assert.deepEqual(msg("DATA-2").sort(), ["/schema 1 entity has no @type", "/schema a JSON-LD block without a schema.org @context"], "an @id reference needs no type");
    assert.deepEqual(msg("DATA-3").sort(), [
      "/schema Event without location",
      "/schema ListItem without position",
      "/schema Product without offers / review / aggregateRating",
    ]);
    assert.ok(msg("DATA-4").includes("/shop/item no BreadcrumbList"), msg("DATA-4").join("\n"));
    assert.ok(!msg("DATA-4").some((m) => m.startsWith("/ru-one ")), "a language prefix is not a level");
    assert.deepEqual(msg("DATA-5").sort(), ["/schema 1 address is not full, e.g. logo: /logo.png", "/schema 1 date is not ISO 8601, e.g. startDate: 05.11.2026"]);
    assert.deepEqual(msg("DATA-6"), ["/ no WebSite with a name on the home page"]);
  });

  it("checks the language versions: self, working targets, matching language, one per code, full addresses", () => {
    const msg = (rule: string) => bad.findings.filter((f) => f.rule === rule && f.where.endsWith("/langs")).map((f) => f.message);
    assert.deepEqual(msg("LANG-4"), ["the page is not in its own hreflang list"]);
    assert.deepEqual(msg("LANG-5").sort(), ["«de» leads to /gone, which answers 404", "«ru» leads to /ru-copy, whose canonical is /"]);
    assert.deepEqual(msg("LANG-7"), ["more than one address for en"]);
    assert.deepEqual(msg("LANG-8"), ["1 relative address, e.g. /relative-fr"]);
    assert.ok(bad.findings.some((f) => f.rule === "LANG-6" && f.message === '«english» leads to /, a page with lang="en"'));
  });

  it("checks the images: size, lazy loading, formats, broken, heavy, alt text", () => {
    const msg = (rule: string) => bad.findings.filter((f) => f.rule === rule && f.where.endsWith("/images")).map((f) => f.message);
    assert.deepEqual(msg("IMG-2"), ["1 of 3 images without width and height, e.g. /big.jpg"]);
    assert.deepEqual(msg("IMG-3"), ["the first image loads lazily: /big.jpg"]);
    assert.ok(!bad.findings.some((f) => f.rule === "IMG-3" && f.where.endsWith("/below")), "an image after a screenful of text may be lazy");
    // Addresses come out as a person reads them: &amp; in the HTML is & in the report.
    assert.ok(bad.findings.some((f) => f.rule === "IMG-4" && f.message.endsWith("/ok.jpg?w=10&h=10")));
    assert.ok(!bad.findings.some((f) => f.rule.startsWith("IMG-") && f.message.includes("&amp;")));
    assert.deepEqual(msg("IMG-4"), ["2 images are JPEG or PNG only, e.g. /big.jpg"], "the one inside <picture> with AVIF is fine");
    assert.deepEqual(msg("IMG-5"), ["image /missing.png answers 404"]);
    assert.deepEqual(msg("IMG-6"), ["image /big.jpg is 600 KB, should be under 500 KB"]);
    assert.deepEqual(msg("IMG-7"), ["1 alt text does not describe the image, e.g. «IMG_1234.jpg»"]);
  });

  it("checks the links: orphans, crawlable, nofollow, link text, links to other sites", () => {
    const msg = (rule: string) => bad.findings.filter((f) => f.rule === rule).map((f) => `${f.where.replace(bad.site, "")} ${f.message}`);
    assert.ok(msg("LNK-3").includes("/blocked no audited page links here: only the sitemap knows this page"), msg("LNK-3").join("\n"));
    assert.ok(!msg("LNK-3").some((m) => m.startsWith("/ ")), "the home page is never an orphan");
    assert.deepEqual(msg("LNK-4"), ["/badlinks 3 links have no address to follow (no href, # or javascript:), e.g. «No href»"], "not <a name>, not #section");
    assert.deepEqual(msg("LNK-5"), ["/badlinks 1 internal link with nofollow, e.g. to /target"]);
    assert.deepEqual(msg("LNK-6").sort(), ["/badlinks 1 link has no text, label or alt, e.g. to /target", "/badlinks 1 link says nothing about the target, e.g. «Read more →»"]);
    assert.equal(msg("LNK-7").length, 1, msg("LNK-7").join("\n"));
    assert.match(msg("LNK-7")[0]!, /^\/badlinks link to http:\/\/127\.0\.0\.1:\d+\/gone answers 404$/, "403 is a bot wall, not a dead link");
  });

  it("does not call outbound links dead without internet access", async () => {
    // Every outside site fails at the network level, as in a sandbox without DNS: «not checked», not 158 dead links.
    const routes: Routes = {};
    const s = await serve(routes);
    const o = s.origin;
    Object.assign(routes, {
      "/sitemap.xml": { type: "application/xml", body: `<urlset><url><loc>${o}/</loc></url></urlset>` },
      "/": { body: html({ title: "Offline outbound links", description: DESCRIPTION, canonical: `${o}/`, body: '<h1>Offline</h1><a href="http://127.0.0.1:9/a">A</a> <a href="http://127.0.0.1:9/b">B</a>' }) },
    });
    const r = await auditSearch(o, {});
    await s.close();
    assert.equal(r.rules.find((x) => x.id === "LNK-7")?.skipped, "no outside site answered: the audit has no internet access");
    assert.ok(!r.findings.some((f) => f.rule === "LNK-7"));
  });

  it("checks the page structure: headings with text, one topic, zoom, language, main, doctype", () => {
    const msg = (rule: string) => bad.findings.filter((f) => f.rule === rule).map((f) => `${f.where.replace(bad.site, "")} ${f.message}`);
    assert.deepEqual(msg("STR-5").sort(), ["/logo-h1 1 empty heading: H2", "/logo-h1 the H1 has no text: only an image or nothing"]);
    assert.ok(msg("STR-6").includes("/offtopic no word in common: title «Pricing for teams and companies», H1 «Welcome to our blog»"), msg("STR-6").join("\n"));
    assert.deepEqual(msg("STR-7"), ["/nozoom zoom is blocked: width=device-width, initial-scale=1, user-scalable=no"]);
    assert.deepEqual(msg("STR-8"), ['/wronglang <html lang="en">, but 97% of the letters are Cyrillic']);
    assert.deepEqual(msg("STR-9"), ["/quirks no <main> on the page"]);
    assert.deepEqual(msg("STR-10"), ["/quirks no <!doctype html> at the start"]);
  });

  it("checks the meta tags: one of each, written for the page, encoding, snippet", () => {
    const msg = (rule: string) => bad.findings.filter((f) => f.rule === rule).map((f) => `${f.where.replace(bad.site, "")} ${f.message}`);
    assert.deepEqual(msg("META-4").sort(), ["/twotitles 2 <title> tags in <head>", "/twotitles 2 meta descriptions in <head>"], "the SVG title does not count");
    assert.deepEqual(msg("META-5"), ["/home-title the title is «Home»"]);
    assert.deepEqual(msg("META-6"), ["/echo the description repeats the title"]);
    assert.deepEqual(msg("META-7"), ["/home-title no charset in the Content-Type header or in <meta charset>"]);
    assert.deepEqual(msg("META-8"), ["/nosnippet the snippet is forbidden: max-snippet:0"]);
  });

  it("checks the sitemap file, its addresses and its dates", () => {
    const msg = (rule: string) => bad.findings.filter((f) => f.rule === rule).map((f) => `${f.where.replace(bad.site, "")} ${f.message}`);
    assert.deepEqual(msg("MAP-4"), ["/sitemap.xml 1 address has a bare & that breaks the XML"]);
    assert.deepEqual(msg("MAP-5"), ["/sitemap.xml 2 addresses are relative or on another site, e.g. /relative-page"]);
    assert.deepEqual(msg("MAP-6"), ["/target linked from 2 audited pages, but not in the sitemap"], "not the feed, not the noindex page");
    assert.deepEqual(msg("MAP-8").sort(), [
      "/sitemap.xml 1 lastmod date is in the future, e.g. 2099-01-01",
      "/sitemap.xml 1 lastmod value is not a W3C date, e.g. «yesterday»",
    ]);
  });

  it("checks the canonical: one, in head, matching the header, no chains, no UTM tags, no other language", () => {
    const msg = (rule: string) => bad.findings.filter((f) => f.rule === rule).map((f) => `${f.where.replace(bad.site, "")} ${f.message}`);
    assert.deepEqual(msg("CAN-4"), [`/twocanon 2 different canonicals: ${bad.site}/twocanon, ${bad.site}/target`]);
    assert.deepEqual(msg("CAN-5"), [`/bodycanon the canonical ${bad.site}/bodycanon is in <body>`]);
    assert.deepEqual(msg("CAN-6"), ["/headercanon the HTML names /headercanon, the Link header names /target"]);
    assert.deepEqual(msg("CAN-7"), ["/chain-a the canonical leads to /chain-b, whose own canonical is /target"]);
    assert.deepEqual(msg("CAN-8"), ["/ /?utm_source=search-auditor&utm_medium=audit names itself, with the UTM tags, as canonical"]);
    assert.ok(msg("CAN-9").includes("/ru-copy the canonical leads to /, the «en» version of this «ru» page"), msg("CAN-9").join("\n"));
  });

  it("checks robots.txt, one site version, redirects and noindex", () => {
    const msg = (rule: string) => bad.findings.filter((f) => f.rule === rule).map((f) => `${f.where.replace(bad.site, "")} ${f.message}`);
    assert.deepEqual(msg("IDX-3"), ["/robots.txt 1 line search engines do not understand, e.g. «Crawl delay 10»"]);
    assert.deepEqual(msg("IDX-4"), ["/blocked listed in the sitemap, but robots.txt blocks it for Googlebot, Bingbot, Yandex"]);
    assert.equal(msg("IDX-5").length, 1);
    assert.match(msg("IDX-5")[0]!, /^\/[\w-]+ \/[\w-]+\/ also answers 200, with no redirect and no canonical to this page$/);
    assert.ok(msg("IDX-6").includes("/ /hop-one takes 2 redirects: /hop-one → /hop-two → /target"), msg("IDX-6").join("\n"));
    assert.ok(msg("IDX-6").includes("/ /loop-a redirects in a loop: /loop-a → /loop-b → /loop-a"), msg("IDX-6").join("\n"));
    assert.equal(bad.findings.find((f) => f.rule === "IDX-6" && f.message.includes("loop"))!.level, "error");
    assert.ok(!msg("IDX-6").some((m) => m.includes("/moved")), "one redirect is not a chain");
    assert.deepEqual(msg("IDX-7").sort(), ["/hidden listed in the sitemap, but closed with noindex", "/hidden noindex together with a canonical to /target: two different signals"]);
    assert.deepEqual(msg("IDX-8"), ["/ robots.txt blocks /assets/app.css for Googlebot"]);
  });

  it("tells where and why", () => {
    const at = (rule: string, path: string) => bad.findings.find((f) => f.rule === rule && f.where.endsWith(path));
    assert.match(at("IDX-1", "/gone")!.message, /404/);
    assert.ok(bad.findings.some((f) => f.rule === "IDX-2" && f.where === "site"));
    assert.ok(at("IDX-2", "/soft"));
    assert.equal(at("CAN-3", "/deadcanon")!.level, "error");
    assert.equal(at("CAN-3", "/redircanon")!.level, "warn");
    // Link problems are reported on the page that has the link: that is where they get fixed.
    assert.equal(at("LNK-1", "/")!.where, `${bad.site}/`);
    assert.equal(at("LNK-1", "/")!.message, "link to /broken answers 404");
    assert.equal(at("LNK-2", "/")!.message, "link to /moved redirects to /target");
    assert.ok(at("MAP-2", "/moved"));
    assert.ok(at("MAP-3", "/deadcanon"));
    assert.ok(!at("MAP-3", "/moved"), "a redirect is MAP-2, not MAP-3");
    assert.equal(bad.findings.find((f) => f.rule === "MAP-1")!.level, "info");
    assert.equal(at("META-1", "/nocanon")!.level, "error");
    assert.equal(at("META-1", "/long")!.level, "warn");
    assert.equal(at("META-2", "/long")!.level, "info");
    assert.equal(bad.findings.filter((f) => f.rule === "META-3").length, 4);
    assert.ok(at("LANG-2", "/") && at("LANG-1", "/") && at("LANG-3", "/"));
  });

  it("does not flag the pages a check is not about", () => {
    // A canonical in <body> does not count, so that page has none as far as search engines are concerned.
    assert.ok(!bad.findings.some((f) => f.rule === "CAN-1" && !f.where.endsWith("/nocanon") && !f.where.endsWith("/bodycanon")));
    assert.ok(!bad.findings.some((f) => f.rule === "STR-4" && !f.where.endsWith("/nocanon")));
  });
});

describe("an SEO report", () => {
  let report: Report;
  let close = async () => {};
  before(async () => {
    const routes: Routes = {};
    const s = await serve(routes);
    Object.assign(routes, goodSite(s.origin));
    close = s.close;
    report = await auditSearch(s.origin, { config: { lang: "ru" } });
  });
  after(() => close());

  it("runs only the classic search checks", () => {
    assert.ok(report.rules.every((r) => seoIds.includes(r.id)), "no AI search checks");
    assert.equal(report.total, seoIds.length);
    assert.equal(report.sections, undefined);
  });

  it("renders the SEO groups in one report", () => {
    const md = toMarkdown(report);
    assert.match(md, /^# SEO-аудит: /);
    assert.ok(md.indexOf("### IDX. Индексация") < md.indexOf("### LANG. Языковые версии"));
    assert.ok(!/### A\. |AI-поиск/.test(md), "no AI search part");
    assert.ok(report.rules.every((r) => r.status), "every check has a status for --json");
    assert.match(md, /\[search-auditor\]\(https:\/\/github\.com\/a-bibikov\/search-auditor\)/);
  });
});

describe("page limit", () => {
  let origin = "";
  let close = async () => {};
  before(async () => {
    const routes: Routes = {};
    const s = await serve(routes);
    Object.assign(routes, goodSite(s.origin));
    origin = s.origin;
    close = s.close;
  });
  after(() => close());

  it("audits a sample or every page in the sitemap", async () => {
    const one = await auditSearch(origin, { config: { maxPages: 1 } });
    const all = await auditSearch(origin, { config: { maxPages: "all" } });
    assert.equal(one.pages.length, 1);
    assert.equal(all.pages.length, 4);
  });
});

describe("sitemap beyond the sample", () => {
  let report: Report;
  let close = async () => {};
  before(async () => {
    const routes: Routes = {};
    const s = await serve(routes);
    const o = s.origin;
    const page = (n: number) => ({ body: html({ title: `Sitemap page number ${n}`, description: `Page ${n}. ${DESCRIPTION}`, canonical: `${o}/p${n}`, body: `<h1>Page ${n}</h1>` }) });
    // Twelve addresses stamped with one build date; one is dead, one redirects. The index also names a missing file.
    const urls = Array.from({ length: 12 }, (_, i) => `<url><loc>${o}/p${i}</loc><lastmod>2026-01-01</lastmod></url>`).join("");
    Object.assign(routes, {
      "/robots.txt": { type: "text/plain", body: `User-agent: *\nAllow: /\nSitemap: ${o}/sitemap-index.xml\n` },
      "/sitemap-index.xml": { type: "application/xml", body: `<sitemapindex><sitemap><loc>${o}/sm-1.xml</loc></sitemap><sitemap><loc>${o}/sm-missing.xml</loc></sitemap></sitemapindex>` },
      "/sm-1.xml": { type: "application/xml", body: `<urlset>${urls}</urlset>` },
      "/": { body: html({ title: "Sitemap test home page", description: DESCRIPTION, canonical: `${o}/`, body: "<h1>Home</h1>" }) },
      ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`/p${i}`, page(i)])),
      "/p10": redirect("/p1"),
    });
    close = s.close;
    report = await auditSearch(o, { config: { maxPages: 3 } });
  });
  after(() => close());

  it("requests the addresses the sample left out", () => {
    const msg = (rule: string) => report.findings.filter((f) => f.rule === rule).map((f) => `${f.where.replace(report.site, "")} ${f.message}`);
    assert.deepEqual(msg("MAP-7"), ["/p11 listed in the sitemap, but answers 404"]);
    assert.ok(msg("MAP-2").includes("/p10 listed in the sitemap, redirects to /p1"), msg("MAP-2").join("\n"));
    assert.deepEqual(msg("MAP-4"), ["/sm-missing.xml answers 404"]);
    assert.deepEqual(msg("MAP-8"), ["/sitemap-index.xml all 12 addresses have the same lastmod, 2026-01-01: it looks like the build time"]);
  });
});
