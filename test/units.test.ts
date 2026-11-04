import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LANGS, parsePage, runRules, type Fetched, type Site } from "ai-search-auditor";
import { SEO_LANGS, seoMessages, seoRules, type SeoExtras } from "../src/index.ts";
import { en } from "../src/i18n/en.ts";

const keys = (o: object, prefix = ""): string[] =>
  Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));

describe("languages", () => {
  it("follow ai-search-auditor, so both halves of a report speak one language", () => {
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
const liveSite = (o: { base: string; body?: string; httpHome?: Partial<Fetched> | null }): Site => {
  const page = parsePage(fetched(`${o.base}/`, o.body ?? "<html><body><h1>Home</h1></body></html>"));
  const seo: SeoExtras = {
    local: false,
    probe404: null,
    httpHome: o.httpHome === null ? null : { ...fetched(`http://${new URL(o.base).host}/`, ""), ...o.httpHome },
    canonicals: new Map(),
    links: new Map(),
    linksFound: 0,
    linksChecked: 0,
  };
  return { target: o.base, base: o.base, robots: null, sitemap: null, pages: [page], failed: [], seo } as unknown as Site;
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
