/** LANG-8: hreflang addresses are full. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";
import { hasHreflang } from "./shared.ts";

export const lang8: SeoRule = {
  id: "LANG-8",
  group: "LANG",
  level: "warn",
  applies: (site, t) => (hasHreflang(site) ? null : t.skipNoHreflang),
  run(site, _c, t) {
    const { out, add } = finder(this);
    // Google requires fully qualified addresses in hreflang: «/ru/» is not one.
    for (const p of site.pages) {
      const relative = p.hreflang.filter((h) => !/^https?:\/\//i.test(h.href.trim()));
      if (relative.length) add(p.fetched.publicUrl, t.relativeHreflang(relative.length, relative[0]!.href));
    }
    return out;
  },
};
