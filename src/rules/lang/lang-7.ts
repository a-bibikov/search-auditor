/** LANG-7: Each language is listed once. */
import { finder } from "auditor-engine";
import { absolute, norm, type SeoRule } from "../util.ts";
import { hasHreflang } from "./shared.ts";

export const lang7: SeoRule = {
  id: "LANG-7",
  group: "LANG",
  level: "warn",
  applies: (site, t) => (hasHreflang(site) ? null : t.skipNoHreflang),
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      // The same code for two different addresses: search engines cannot tell which one to show and may drop both.
      const byCode = new Map<string, Set<string>>();
      for (const h of p.hreflang) {
        const code = h.lang.toLowerCase();
        byCode.set(code, new Set([...(byCode.get(code) ?? []), norm(absolute(h.href, p.fetched.publicUrl))]));
      }
      const twice = [...byCode].filter(([, urls]) => urls.size > 1).map(([code]) => code);
      if (twice.length) add(p.fetched.publicUrl, t.duplicateHreflang(twice.join(", ")));
    }
    return out;
  },
};
