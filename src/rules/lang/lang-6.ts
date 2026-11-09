/** LANG-6: The hreflang language matches the language of the page it points to. */
import { finder } from "auditor-engine";
import { absolute, norm, rel, type SeoRule } from "../util.ts";
import { hasHreflang, primary } from "./shared.ts";

export const lang6: SeoRule = {
  id: "LANG-6",
  group: "LANG",
  level: "warn",
  applies: (site, t) => (hasHreflang(site) ? null : t.skipNoHreflang),
  run(site, _c, t) {
    const { out, add } = finder(this);
    const pages = new Map(site.pages.map((p) => [norm(p.fetched.publicUrl), p]));
    for (const p of site.pages)
      for (const h of p.hreflang) {
        if (h.lang.toLowerCase() === "x-default") continue;
        const target = pages.get(norm(absolute(h.href, p.fetched.publicUrl)));
        const declared = target ? primary(target.htmlLang) : "";
        // Compared by language only: hreflang="en-GB" on a page with lang="en" is fine.
        if (target && declared && declared !== primary(h.lang))
          add(p.fetched.publicUrl, t.hreflangLangMismatch(h.lang, rel(target.fetched.publicUrl, site.base), target.htmlLang));
      }
    return out;
  },
};
