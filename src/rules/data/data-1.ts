/** DATA-1: Structured data has no syntax errors. */
import { finder } from "auditor-engine";
import { short, type SeoRule } from "../util.ts";

export const data1: SeoRule = {
  id: "DATA-1",
  group: "DATA",
  level: "error",
  applies: (site, t) => (site.pages.some((p) => p.jsonLd.length || p.jsonLdErrors.length) ? null : t.skipNoJsonLd),
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) for (const e of p.jsonLdErrors) add(p.fetched.publicUrl, t.jsonLdError(short(e, 100)));
    return out;
  },
};
