import { finder, isSameSite } from "ai-search-auditor";
import { seoOf } from "../collect.ts";
import { absolute, norm, rel, statusOf, type SeoRule } from "./util.ts";

const lnk1: SeoRule = {
  id: "LNK-1",
  group: "LNK",
  level: "error",
  applies: (site, t) => (seoOf(site).linksFound ? null : t.skipNoLinks),
  run(site, _c, t) {
    const { out, add } = finder(this);
    const { links, linksFound, linksChecked } = seoOf(site);
    for (const [url, p] of links) if (p.status === 0 || p.status >= 400) add(url, t.brokenLink(statusOf(p), rel(p.from ?? site.base, site.base)));
    if (linksChecked < linksFound) add("site", t.linksNotChecked(linksChecked, linksFound), "info");
    return out;
  },
};

const lnk2: SeoRule = {
  id: "LNK-2",
  group: "LNK",
  level: "warn",
  applies: (site, t) => (seoOf(site).linksFound ? null : t.skipNoLinks),
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const [url, p] of seoOf(site).links)
      if (p.status > 0 && p.status < 400 && p.redirected && norm(p.finalUrl) !== norm(url)) add(url, t.redirectLink(rel(p.finalUrl, site.base), rel(p.from ?? site.base, site.base)));
    return out;
  },
};

/** ISO 639-1 language, optional ISO 15924 script and region (ISO 3166-1 or UN M.49), or x-default. */
const HREFLANG = /^(x-default|[a-z]{2,3}(-[a-z]{4})?(-([a-z]{2}|\d{3}))?)$/i;
const hasHreflang = (site: Parameters<SeoRule["run"]>[0]) => site.pages.some((p) => p.hreflang.length);

const lang1: SeoRule = {
  id: "LANG-1",
  group: "LANG",
  level: "warn",
  applies: (site, t) => (hasHreflang(site) ? null : t.skipNoHreflang),
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) for (const h of p.hreflang) if (!HREFLANG.test(h.lang)) add(p.fetched.publicUrl, t.badHreflang(h.lang));
    return out;
  },
};

const lang2: SeoRule = {
  id: "LANG-2",
  group: "LANG",
  level: "warn",
  applies: (site, t) => (hasHreflang(site) ? null : t.skipNoHreflang),
  run(site, _c, t) {
    const { out, add } = finder(this);
    const o = { target: site.target, base: site.base };
    // Only pairs where both pages were audited: a translation outside the sample is not known to be one-way.
    const audited = new Map(site.pages.map((p) => [norm(p.fetched.publicUrl), p]));
    for (const p of site.pages) {
      const self = norm(p.fetched.publicUrl);
      for (const h of p.hreflang) {
        if (h.lang.toLowerCase() === "x-default") continue;
        const href = absolute(h.href, p.fetched.publicUrl);
        if (!href || !isSameSite(href, o) || norm(href) === self) continue;
        const other = audited.get(norm(href));
        if (other && !other.hreflang.some((b) => norm(absolute(b.href, other.fetched.publicUrl)) === self)) add(p.fetched.publicUrl, t.oneWayHreflang(h.lang, rel(href, site.base)));
      }
    }
    return out;
  },
};

const lang3: SeoRule = {
  id: "LANG-3",
  group: "LANG",
  level: "info",
  applies(site, t) {
    if (!hasHreflang(site)) return t.skipNoHreflang;
    return site.pages.some((p) => new Set(p.hreflang.filter((h) => h.lang.toLowerCase() !== "x-default").map((h) => h.lang.toLowerCase())).size > 1) ? null : t.skipOneLanguage;
  },
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      const langs = [...new Set(p.hreflang.map((h) => h.lang.toLowerCase()))];
      if (langs.length > 1 && !langs.includes("x-default")) add(p.fetched.publicUrl, t.noXDefault(langs.join(", ")));
    }
    return out;
  },
};

export const linkRules = [lnk1, lnk2, lang1, lang2, lang3];
