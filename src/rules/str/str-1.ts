/** STR-1: One H1 per page. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";

export const str1: SeoRule = {
  id: "STR-1",
  group: "STR",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      if (!p.h1.length) add(p.fetched.publicUrl, t.noH1);
      else if (p.h1.length > 1) add(p.fetched.publicUrl, t.manyH1(p.h1.length));
    }
    return out;
  },
};
