/** STR-3: The page declares its language. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";

export const str3: SeoRule = {
  id: "STR-3",
  group: "STR",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) if (!p.htmlLang.trim()) add(p.fetched.publicUrl, t.noLang);
    return out;
  },
};
