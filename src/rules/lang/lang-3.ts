/** LANG-3: There is an x-default for other languages. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";
import { hasHreflang } from "./shared.ts";

export const lang3: SeoRule = {
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
