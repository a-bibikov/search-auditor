/** LANG-4: Every version lists itself in hreflang. */
import { finder } from "auditor-engine";
import { absolute, norm, type SeoRule } from "../util.ts";
import { hasHreflang } from "./shared.ts";

export const lang4: SeoRule = {
  id: "LANG-4",
  group: "LANG",
  level: "warn",
  applies: (site, t) => (hasHreflang(site) ? null : t.skipNoHreflang),
  run(site, _c, t) {
    const { out, add } = finder(this);
    // Google wants each version in its own list: a set that leaves the page out may be ignored.
    for (const p of site.pages) {
      if (!p.hreflang.length) continue;
      const self = norm(p.fetched.publicUrl);
      const lists = p.hreflang.some((h) => h.lang.toLowerCase() !== "x-default" && norm(absolute(h.href, p.fetched.publicUrl)) === self);
      if (!lists) add(p.fetched.publicUrl, t.noSelfHreflang);
    }
    return out;
  },
};
