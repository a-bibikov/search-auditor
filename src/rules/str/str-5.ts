/** STR-5: Headings are not empty. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";

export const str5: SeoRule = {
  id: "STR-5",
  group: "STR",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      // An H1 that is only a logo reads as no H1 at all: the alt text of an image is not heading text.
      if (p.h1.length && p.h1.every((h) => !h.trim())) add(p.fetched.publicUrl, t.emptyH1);
      const empty = p.headingsAll.filter((h) => h.level > 1 && !h.text.trim());
      if (empty.length) add(p.fetched.publicUrl, t.emptyHeadings(empty.length, [...new Set(empty.map((h) => `H${h.level}`))].join(", ")), "info");
    }
    return out;
  },
};
