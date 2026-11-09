/** LANG-2: Language versions point at each other. */
import { finder, isSameSite } from "auditor-engine";
import { absolute, norm, rel, type SeoRule } from "../util.ts";
import { hasHreflang } from "./shared.ts";

export const lang2: SeoRule = {
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
