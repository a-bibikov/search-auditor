import { finder, isSameSite } from "ai-search-auditor";
import { seoOf } from "../collect.ts";
import { absolute, norm, rel, short, statusOf, type SeoRule } from "./util.ts";

/** Titles and H1s of «not found» pages that still answer 200. */
const NOT_FOUND = /\b(404|not found|page not found|doesn.t exist)\b|не найден|страница не существует|ничего не найдено/i;

const idx1: SeoRule = {
  id: "IDX-1",
  group: "IDX",
  level: "error",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const f of site.failed) if (f.status !== 200) add(f.publicUrl, t.status(statusOf(f)));
    return out;
  },
};

const idx2: SeoRule = {
  id: "IDX-2",
  group: "IDX",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    const probe = seoOf(site).probe404;
    if (probe && probe.status === 200) add("site", t.soft404Probe(rel(probe.publicUrl, site.base)));
    for (const p of site.pages) {
      const head = p.h1[0] ?? "";
      if (NOT_FOUND.test(p.title) || NOT_FOUND.test(head)) add(p.fetched.publicUrl, t.soft404Page(short(p.title || head)));
    }
    return out;
  },
};

const sec1: SeoRule = {
  id: "SEC-1",
  group: "SEC",
  level: "error",
  applies: (site, t) => (seoOf(site).local ? t.skipLocal : null),
  run(site, _c, t) {
    const { out, add } = finder(this);
    if (!site.base.startsWith("https://")) {
      add("site", t.notHttps);
      return out;
    }
    // Only an http:// answer that stays on http:// is a problem; a closed port 80 is not.
    const home = seoOf(site).httpHome;
    if (home && home.status > 0 && !(home.finalUrl ?? "").startsWith("https://")) add(home.publicUrl, t.httpNoRedirect(home.finalUrl ?? home.publicUrl));
    return out;
  },
};

const sec2: SeoRule = {
  id: "SEC-2",
  group: "SEC",
  level: "warn",
  applies: (site, t) => (site.base.startsWith("https://") ? null : t.skipNotHttps),
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      const insecure = p.resources.filter((r) => r.startsWith("http://"));
      if (insecure.length) add(p.fetched.publicUrl, t.mixedContent(insecure.length, insecure[0]!));
    }
    return out;
  },
};

const can1: SeoRule = {
  id: "CAN-1",
  group: "CAN",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) if (!p.canonical) add(p.fetched.publicUrl, t.noCanonical);
    return out;
  },
};

const can2: SeoRule = {
  id: "CAN-2",
  group: "CAN",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    const o = { target: site.target, base: site.base };
    for (const p of site.pages) {
      if (!p.canonical) continue;
      if (!/^https?:\/\//i.test(p.canonical)) add(p.fetched.publicUrl, t.relativeCanonical(p.canonical));
      else if (!isSameSite(p.canonical, o)) add(p.fetched.publicUrl, t.foreignCanonical(p.canonical));
    }
    return out;
  },
};

const can3: SeoRule = {
  id: "CAN-3",
  group: "CAN",
  level: "error",
  run(site, _c, t) {
    const { out, add } = finder(this);
    const { canonicals } = seoOf(site);
    const o = { target: site.target, base: site.base };
    // A canonical pointing at a sampled page is known from the crawl; others were requested in collect().
    const sampled = new Map(site.pages.map((p) => [norm(p.fetched.publicUrl), p.fetched]));
    const failed = new Map(site.failed.map((f) => [norm(f.publicUrl), f]));
    for (const p of site.pages) {
      const href = p.canonical ? absolute(p.canonical, p.fetched.publicUrl) : "";
      if (!href || !isSameSite(href, o)) continue;
      const key = norm(href);
      const known = sampled.get(key) ?? failed.get(key);
      const probe = known ? { status: known.status, error: known.error, redirected: Boolean(known.redirected), finalUrl: known.finalUrl ?? known.publicUrl } : canonicals.get(key);
      if (!probe) continue;
      if (probe.status !== 200) add(p.fetched.publicUrl, t.canonicalStatus(rel(href, site.base), statusOf(probe)));
      else if (probe.redirected && norm(probe.finalUrl) !== key) add(p.fetched.publicUrl, t.canonicalRedirects(rel(href, site.base), rel(probe.finalUrl, site.base)), "warn");
    }
    return out;
  },
};

const map1: SeoRule = {
  id: "MAP-1",
  group: "MAP",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    if (!site.sitemap) add("site", t.noSitemap);
    else if (site.robots && !/^\s*sitemap\s*:/im.test(site.robots.fetched.body)) add("site", t.sitemapNotInRobots, "info");
    return out;
  },
};

const inSitemap = (site: Parameters<SeoRule["run"]>[0]) => new Set((site.sitemap?.urls ?? []).map((u) => norm(u.loc)));

const map2: SeoRule = {
  id: "MAP-2",
  group: "MAP",
  level: "warn",
  applies: (site, t) => (site.sitemap ? null : t.skipNoSitemap),
  run(site, _c, t) {
    const { out, add } = finder(this);
    const listed = inSitemap(site);
    for (const f of [...site.pages.map((p) => p.fetched), ...site.failed]) {
      if (!listed.has(norm(f.publicUrl)) || !f.redirected || !f.finalUrl) continue;
      if (norm(f.finalUrl) !== norm(f.publicUrl)) add(f.publicUrl, t.sitemapRedirects(rel(f.finalUrl, site.base)));
    }
    return out;
  },
};

const map3: SeoRule = {
  id: "MAP-3",
  group: "MAP",
  level: "warn",
  applies: (site, t) => (site.sitemap ? null : t.skipNoSitemap),
  run(site, _c, t) {
    const { out, add } = finder(this);
    const listed = inSitemap(site);
    for (const p of site.pages) {
      const f = p.fetched;
      // A listed address that redirects is MAP-2's finding; its target's canonical says nothing new.
      if (!listed.has(norm(f.publicUrl)) || (f.finalUrl && norm(f.finalUrl) !== norm(f.publicUrl))) continue;
      const href = p.canonical ? absolute(p.canonical, f.publicUrl) : "";
      if (href && norm(href) !== norm(f.publicUrl)) add(f.publicUrl, t.sitemapCanonicalElsewhere(rel(href, site.base)));
    }
    return out;
  },
};

export const siteRules = [idx1, idx2, sec1, sec2, can1, can2, can3, map1, map2, map3];
