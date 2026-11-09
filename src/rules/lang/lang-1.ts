/** LANG-1: hreflang codes are valid. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";
import { HREFLANG, hasHreflang } from "./shared.ts";

export const lang1: SeoRule = {
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
