/** LANG-5: hreflang leads to working canonical pages. */
import { finder, isSameSite } from "auditor-engine";
import { absolute, norm, rel, statusOf, type SeoRule } from "../util.ts";
import { hasHreflang } from "./shared.ts";

export const lang5: SeoRule = {
  id: "LANG-5",
  group: "LANG",
  level: "warn",
  applies: (site, t) => (hasHreflang(site) ? null : t.skipNoHreflang),
  run(site, _c, t) {
    const { out, add } = finder(this);
    const o = { target: site.target, base: site.base };
    // What is known about each address: audited pages, and those that failed. Others are not guessed at.
    const pages = new Map(site.pages.map((p) => [norm(p.fetched.publicUrl), p]));
    const failed = new Map(site.failed.map((f) => [norm(f.publicUrl), f]));
    for (const p of site.pages)
      for (const h of p.hreflang) {
        const href = absolute(h.href, p.fetched.publicUrl);
        if (!href || !isSameSite(href, o)) continue;
        const where = rel(href, site.base);
        const bad = failed.get(norm(href));
        const target = pages.get(norm(href));
        if (bad) add(p.fetched.publicUrl, t.hreflangStatus(h.lang, where, statusOf(bad)));
        else if (target?.fetched.redirected && target.fetched.finalUrl && norm(target.fetched.finalUrl) !== norm(href))
          add(p.fetched.publicUrl, t.hreflangRedirects(h.lang, where, rel(target.fetched.finalUrl, site.base)));
        else if (target?.canonical && norm(absolute(target.canonical, href)) !== norm(href))
          add(p.fetched.publicUrl, t.hreflangNotCanonical(h.lang, where, rel(absolute(target.canonical, href), site.base)));
      }
    return out;
  },
};
