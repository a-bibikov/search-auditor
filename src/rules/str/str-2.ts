/** STR-2: Heading levels do not skip. */
import { finder } from "auditor-engine";
import { short, type SeoRule } from "../util.ts";

export const str2: SeoRule = {
  id: "STR-2",
  group: "STR",
  level: "info",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      // One finding per page: the first skip is enough to show the pattern.
      const hs = p.headingsAll;
      const i = hs.findIndex((h, k) => k > 0 && h.level > hs[k - 1]!.level + 1);
      if (i > 0) add(p.fetched.publicUrl, t.skippedLevel(hs[i - 1]!.level, hs[i]!.level, short(hs[i]!.text, 50)));
    }
    return out;
  },
};
