import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LANGS, parsePage, parseRobots, runRules, type Fetched, type Site } from "auditor-engine";
import { SEO_LANGS, seoMessages, seoRules, type SeoExtras } from "../src/index.ts";
import { en } from "../src/i18n/en.ts";

const keys = (o: object, prefix = ""): string[] =>
  Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));

describe("languages", () => {
  it("follow auditor-engine, so the whole report speaks one language", () => {
    assert.deepEqual(Object.keys(SEO_LANGS).sort(), Object.keys(LANGS).sort());
  });

  it("every language has every string of English", () => {
    for (const [lang, t] of Object.entries(SEO_LANGS)) assert.deepEqual(keys(t).sort(), keys(en).sort(), lang);
  });

  it("every rule has texts, and every text has a rule", () => {
    assert.deepEqual(seoRules.map((r) => r.id).sort(), Object.keys(en.rules).sort());
    assert.deepEqual(Object.keys(en.groups).sort(), [...new Set(seoRules.map((r) => r.group))].sort());
  });

  it("Russian is translated, not copied", () => {
    const same = keys(en.rules).filter((k) => {
      const [id, field] = k.split(".") as [keyof typeof en.rules, "title" | "fix" | "impact"];
      return SEO_LANGS.ru.rules[id][field] === en.rules[id][field] && field !== "title";
    });
    assert.deepEqual(same, []);
  });
});

const fetched = (url: string, body: string): Fetched => ({ url, publicUrl: url, status: 200, headers: new Headers(), body });

/** A live https site, built by hand: a local fixture server cannot speak https. */
const liveSite = (o: {
  base: string;
  body?: string;
  httpHome?: Partial<Fetched> | null;
  robots?: Partial<Fetched>;
  otherHost?: Fetched;
  ttfb?: number[];
  headers?: Record<string, string>;
  httpHop?: { status: number; location: string };
  cert?: SeoExtras["cert"];
  sitemap?: string[];
}): Site => {
  const page = parsePage({ ...fetched(`${o.base}/`, o.body ?? "<html><body><h1>Home</h1></body></html>"), headers: new Headers(o.headers ?? {}) });
  const seo: SeoExtras = {
    local: false,
    probe404: null,
    httpHome: o.httpHome === null ? null : { ...fetched(`http://${new URL(o.base).host}/`, ""), ...o.httpHome },
    canonicals: new Map(),
    links: new Map(),
    linksFound: 0,
    linksChecked: 0,
    robotsRaw: { ...fetched(`${o.base}/robots.txt`, "User-agent: *\nAllow: /\n"), ...o.robots },
    otherHost: o.otherHost ?? null,
    slashVariant: null,
    chains: [],
    ttfb: o.ttfb ?? null,
    httpHop: o.httpHop ?? null,
    cert: o.cert ?? null,
    utm: null,
    sitemapFiles: [],
    sitemapExtra: new Map(),
    favicon: null,
    external: new Map(),
    images: new Map(),
  };
  const sitemap = o.sitemap ? { urls: o.sitemap.map((loc) => ({ loc })) } : null;
  return { target: o.base, base: o.base, robots: null, sitemap, pages: [page], failed: [], seo } as unknown as Site;
};

const run = (site: Site, ids: string[]) => {
  const t = seoMessages("en");
  return runRules(site, seoRules.filter((r) => ids.includes(r.id)), { disable: [], maxLinks: 0 } as never, t.m, t.rules);
};

describe("HTTPS", () => {
  it("passes when http:// redirects to https://", () => {
    const r = run(liveSite({ base: "https://example.com", httpHome: { finalUrl: "https://example.com/", redirected: true } }), ["SEC-1"]);
    assert.deepEqual(r.findings, []);
  });

  it("flags http:// that stays on http://", () => {
    const r = run(liveSite({ base: "https://example.com", httpHome: { finalUrl: "http://example.com/" } }), ["SEC-1"]);
    assert.match(r.findings[0]!.message, /does not redirect/);
  });

  it("does not blame a closed port 80", () => {
    const r = run(liveSite({ base: "https://example.com", httpHome: { status: 0, error: "ECONNREFUSED" } }), ["SEC-1"]);
    assert.deepEqual(r.findings, []);
  });

  it("flags a site that is not on https", () => {
    const r = run(liveSite({ base: "http://example.com", httpHome: null }), ["SEC-1", "SEC-2"]);
    assert.equal(r.findings[0]!.message, en.m.notHttps);
    assert.equal(r.rules.find((x) => x.id === "SEC-2")!.skipped, en.m.skipNotHttps);
  });

  it("finds mixed content", () => {
    const r = run(liveSite({ base: "https://example.com", body: '<html><body><img src="http://cdn.example.com/a.png" alt=""><script src="https://example.com/a.js"></script></body></html>' }), ["SEC-2"]);
    assert.match(r.findings[0]!.message, /1 resource over http:\/\/, e\.g\. http:\/\/cdn\.example\.com\/a\.png/);
  });
});

describe("indexing on a live site", () => {
  const base = "https://example.com";

  it("treats a robots.txt that fails as a closed site, and a missing one as no rules", () => {
    const failing = run(liveSite({ base, robots: { status: 503, body: "" } }), ["IDX-3"]);
    assert.equal(failing.findings[0]!.level, "error");
    assert.match(failing.findings[0]!.message, /answers 503: until it answers, Google treats the whole site as closed/);
    assert.deepEqual(run(liveSite({ base, robots: { status: 404, body: "" } }), ["IDX-3"]).findings, []);
    assert.equal(run(liveSite({ base, robots: { status: 0, error: "timeout", body: "" } }), ["IDX-3"]).findings[0]!.message.startsWith("robots.txt answers timeout"), true);
  });

  it("flags HTML instead of rules and a robots.txt over 500 KB", () => {
    assert.equal(run(liveSite({ base, robots: { body: "<!doctype html><html></html>" } }), ["IDX-3"]).findings[0]!.message, en.m.robotsHtml);
    const big = `User-agent: *\n${"Disallow: /private-path-that-is-long\n".repeat(16_000)}`;
    assert.match(run(liveSite({ base, robots: { body: big } }), ["IDX-3"]).findings[0]!.message, /robots\.txt is \d{3} KB/);
  });

  it("flags the other host when it answers on its own, not when it redirects", () => {
    const copy = { ...fetched("https://www.example.com/", "<html></html>"), finalUrl: "https://www.example.com/" };
    assert.match(run(liveSite({ base, otherHost: copy }), ["IDX-5"]).findings[0]!.message, /https:\/\/www\.example\.com\/ answers 200 instead of redirecting/);
    const moved = { ...copy, finalUrl: "https://example.com/", redirected: true };
    assert.deepEqual(run(liveSite({ base, otherHost: moved }), ["IDX-5"]).findings, []);
  });

  it("notes a slow server and warns about a very slow one", () => {
    assert.deepEqual(run(liveSite({ base, ttfb: [300, 400, 350] }), ["IDX-9"]).findings, []);
    const slow = run(liveSite({ base, ttfb: [900, 1200, 1000] }), ["IDX-9"]).findings[0]!;
    assert.deepEqual([slow.level, slow.message], ["info", "the home page starts to arrive after 1.0 s (median of 3 requests), should be under 0.8 s"]);
    assert.equal(run(liveSite({ base, ttfb: [2500, 2100, 3000] }), ["IDX-9"]).findings[0]!.level, "warn");
    const ru = seoMessages("ru").m.slowServer(1234, 800);
    assert.equal(ru, "главная начинает приходить через 1,2 с (медиана из 3 запросов), нужно до 0,8 с");
    const m = seoMessages("ru").m;
    assert.equal(m.descriptionLength(185, 50, 160), "description на 185 символов, нужно 50–160");
    assert.equal(m.titleLength(61, "x", 10, 60), "title на 61 символ, нужно 10–60: «x»");
    assert.equal(m.titleLength(62, "x", 10, 60), "title на 62 символа, нужно 10–60: «x»");
  });
});

describe("security and HTTPS on a live site", () => {
  const base = "https://example.com";
  const secure = {
    "strict-transport-security": "max-age=31536000; includeSubDomains",
    "x-content-type-options": "nosniff",
    "x-frame-options": "SAMEORIGIN",
    "referrer-policy": "strict-origin-when-cross-origin",
  };
  const messages = (site: Site, id: string) => run(site, [id]).findings.map((f) => `${f.level} ${f.message}`);

  it("wants a permanent redirect from http://", () => {
    assert.deepEqual(messages(liveSite({ base, httpHop: { status: 302, location: "https://example.com/" } }), "SEC-3"), ["warn answers 302, a temporary redirect, instead of 301"]);
    assert.deepEqual(messages(liveSite({ base, httpHop: { status: 301, location: "https://example.com/" } }), "SEC-3"), []);
    assert.deepEqual(messages(liveSite({ base, httpHop: { status: 308, location: "https://example.com/" } }), "SEC-3"), []);
  });

  it("checks the certificate: expired, untrusted, about to expire", () => {
    const cert = (c: Partial<NonNullable<SeoExtras["cert"]>>) => liveSite({ base, cert: { valid: true, daysLeft: 80, validTo: "2027-01-28", ...c } });
    assert.deepEqual(messages(cert({}), "SEC-4"), []);
    assert.deepEqual(messages(cert({ valid: false, daysLeft: -3, validTo: "2026-11-06", error: "CERT_HAS_EXPIRED" }), "SEC-4"), ["error the certificate expired on 2026-11-06"]);
    assert.deepEqual(messages(cert({ valid: false, error: "ERR_TLS_CERT_ALTNAME_INVALID" }), "SEC-4"), ["error browsers do not trust the certificate: ERR_TLS_CERT_ALTNAME_INVALID"]);
    assert.deepEqual(messages(cert({ daysLeft: 5, validTo: "2026-11-14" }), "SEC-4"), ["warn the certificate expires in 5 days, on 2026-11-14"]);
  });

  it("wants HSTS for half a year at least", () => {
    assert.deepEqual(messages(liveSite({ base, headers: secure }), "SEC-5"), []);
    assert.deepEqual(messages(liveSite({ base }), "SEC-5"), ["warn no Strict-Transport-Security header"]);
    assert.deepEqual(messages(liveSite({ base, headers: { "strict-transport-security": "max-age=86400" } }), "SEC-5"), ["info HSTS max-age is 1 day; at least 180 are needed"]);
  });

  it("finds the site's own addresses over http://", () => {
    const body = '<html><head><link rel="canonical" href="http://example.com/"><meta property="og:image" content="http://example.com/og.png"></head><body><a href="http://example.com/about">About</a><a href="https://example.com/ok">Ok</a><a href="http://other.example/">Other</a></body></html>';
    const found = messages(liveSite({ base, body, sitemap: ["http://example.com/", "https://example.com/blog"] }), "SEC-6");
    assert.deepEqual(found, [
      "warn canonical uses http://: http://example.com/",
      "warn og:image uses http://: http://example.com/og.png",
      "warn 1 internal link over http://, e.g. http://example.com/about",
      "warn 1 address over http://, e.g. http://example.com/",
    ]);
    assert.deepEqual(messages(liveSite({ base, body: '<html><head><link rel="canonical" href="https://example.com/"></head></html>' }), "SEC-6"), []);
  });

  it("notes missing security headers", () => {
    assert.deepEqual(messages(liveSite({ base, headers: secure }), "SEC-7"), []);
    assert.deepEqual(messages(liveSite({ base, headers: { "content-security-policy": "frame-ancestors 'self'" } }), "SEC-7"), [
      "info missing: X-Content-Type-Options: nosniff, Referrer-Policy",
    ]);
  });

  it("does not check the connection of a local build", () => {
    const site = liveSite({ base });
    (site as unknown as { seo: SeoExtras }).seo.local = true;
    const r = run(site, ["SEC-3", "SEC-4", "SEC-5", "SEC-7"]);
    assert.ok(r.rules.every((x) => x.skipped === en.m.skipLocal));
  });
});

describe("indexing without the AI search checks", () => {
  const base = "https://example.com";

  it("flags robots.txt that closes the site even without a sitemap", () => {
    const site = { ...liveSite({ base }), robots: { parsed: parseRobots("User-agent: *\nDisallow: /\n") } } as Site;
    const r = run(site, ["IDX-4"]);
    assert.deepEqual(r.findings.map((f) => [f.where, f.message]), [[`${base}/`, "robots.txt blocks it for Googlebot, Bingbot, Yandex"]]);
  });

  it("flags noindex on the home page as an error", () => {
    const r = run(liveSite({ base, headers: { "x-robots-tag": "noindex" } }), ["IDX-7"]);
    assert.deepEqual(r.findings.map((f) => [f.level, f.message]), [["error", en.m.noindexHome]]);
  });
});
