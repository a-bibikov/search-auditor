import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { toMarkdown } from "ai-search-auditor";
import { auditSearch, seoRules, type Report } from "../src/index.ts";
import { DESCRIPTION, html, redirect, serve, words, type Routes } from "./site.ts";

const fired = (r: Report) => new Set(r.findings.map((f) => f.rule));
const seoIds = seoRules.map((r) => r.id);
const skipped = (r: Report) => new Set(r.rules.filter((x) => x.skipped).map((x) => x.id));

/** A site that does everything right: the SEO checks must stay silent. */
const goodSite = (o: string): Routes => {
  const langs = `<link rel="alternate" hreflang="en" href="${o}/"><link rel="alternate" hreflang="ru" href="${o}/ru/"><link rel="alternate" hreflang="x-default" href="${o}/">`;
  const ld = `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Person","name":"Ada Example"}</script>`;
  return {
    "/robots.txt": { type: "text/plain", body: `User-agent: *\nAllow: /\n\nSitemap: ${o}/sitemap.xml\n` },
    "/sitemap.xml": { type: "application/xml", body: `<urlset><url><loc>${o}/</loc></url><url><loc>${o}/ru/</loc></url><url><loc>${o}/blog/post</loc></url></urlset>` },
    "/": {
      body: html({
        title: "Ada Example: engineer and writer",
        description: DESCRIPTION,
        canonical: `${o}/`,
        head: langs + ld,
        body: `<h1>Ada Example</h1><h2>Work</h2><h3>Projects</h3><p>${words(80)}</p><img src="/me.jpg" alt="Ada at work"><img src="/line.svg" alt=""><a href="/blog/post">Post</a> <a href="/ru/">RU</a> <a href="/about">About</a>`,
      }),
    },
    "/ru/": { body: html({ lang: "ru", title: "Ада Пример: инженер и автор", description: `Русская версия. ${DESCRIPTION}`, canonical: `${o}/ru/`, head: langs, body: `<h1>Ада Пример</h1><p>${words(80)}</p>` }) },
    "/blog/post": { body: html({ title: "How answers work", description: `About answers. ${DESCRIPTION}`, canonical: `${o}/blog/post`, body: `<h1>How answers work</h1><h2>Why</h2><p>${words(120)}</p>` }) },
    "/about": { body: html({ title: "About Ada Example", description: `About. ${DESCRIPTION}`, canonical: `${o}/about`, body: `<h1>About</h1>` }) },
  };
};

/** One mistake or more per rule. */
const badSite = (o: string): Routes => ({
  "/robots.txt": { type: "text/plain", body: `User-agent: *\nAllow: /\n` },
  "/sitemap.xml": {
    type: "application/xml",
    body: `<urlset>${["/", "/moved", "/gone", "/soft", "/nocanon", "/relcanon", "/foreign", "/deadcanon", "/redircanon", "/dup-one", "/dup-two", "/jsonbad", "/ru-one", "/long"].map((p) => `<url><loc>${o}${p}</loc></url>`).join("")}</urlset>`,
  },
  "/": {
    body: html({
      title: "Bad example site home",
      description: DESCRIPTION,
      canonical: `${o}/`,
      head: `<link rel="alternate" hreflang="en" href="${o}/"><link rel="alternate" hreflang="ru" href="${o}/ru-one"><link rel="alternate" hreflang="english" href="${o}/">`,
      body: `<h1>Home</h1><img src="/photo.jpg"><a href="/broken">Broken</a> <a href="/moved">Moved</a>`,
    }),
  },
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
    const badRoutes: Routes = {};
    const s2 = await serve(badRoutes, (path) => (path.startsWith("/__search-auditor-") ? { body: html({ title: "Home", body: "<h1>Home</h1>" }) } : undefined));
    Object.assign(badRoutes, badSite(s2.origin));
    closers.push(s1.close, s2.close);
    good = await auditSearch(s1.origin, { config: { ai: false } });
    bad = await auditSearch(s2.origin, { config: { ai: false } });
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
    const missing = seoIds.filter((id) => !id.startsWith("SEC-") && !fired(bad).has(id));
    assert.deepEqual(missing, []);
  });

  it("tells where and why", () => {
    const at = (rule: string, path: string) => bad.findings.find((f) => f.rule === rule && f.where.endsWith(path));
    assert.match(at("IDX-1", "/gone")!.message, /404/);
    assert.ok(bad.findings.some((f) => f.rule === "IDX-2" && f.where === "site"));
    assert.ok(at("IDX-2", "/soft"));
    assert.equal(at("CAN-3", "/deadcanon")!.level, "error");
    assert.equal(at("CAN-3", "/redircanon")!.level, "warn");
    assert.match(at("LNK-1", "/broken")!.message, /^answers 404, linked from \/$/);
    assert.match(at("LNK-2", "/moved")!.message, /\/target/);
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
    assert.ok(!bad.findings.some((f) => f.rule === "CAN-1" && !f.where.endsWith("/nocanon")));
    assert.ok(!bad.findings.some((f) => f.rule === "STR-4" && !f.where.endsWith("/nocanon")));
  });
});

describe("one report for both kinds of search", () => {
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

  it("scores each part and the whole", () => {
    assert.deepEqual(
      report.sections!.map((s) => s.name),
      ["Классический поиск", "AI-поиск"],
    );
    const mean = Math.round(report.sections!.reduce((n, s) => n + s.score, 0) / 2);
    assert.equal(report.score, mean);
    assert.equal(report.total, report.sections!.reduce((n, s) => n + s.total, 0));
  });

  it("renders SEO groups first, then AI search", () => {
    const md = toMarkdown(report);
    assert.match(md, /^# Аудит для поиска: /);
    assert.ok(md.indexOf("**IDX. Индексация**") < md.indexOf("**A. "), "SEO before AI");
    assert.match(md, /Классический поиск:\*\* \d+\/100/);
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
    const one = await auditSearch(origin, { config: { ai: false, maxPages: 1 } });
    const all = await auditSearch(origin, { config: { ai: false, maxPages: "all" } });
    assert.equal(one.pages.length, 1);
    assert.equal(all.pages.length, 3);
  });
});
