/** STR-6: The title and the H1 are about the same thing. */
import { finder } from "auditor-engine";
import { short, type SeoRule } from "../util.ts";
import { stems } from "./shared.ts";

export const str6: SeoRule = {
  id: "STR-6",
  group: "STR",
  level: "info",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      const h1 = p.h1.find((h) => h.trim()) ?? "";
      if (!h1 || !p.title.trim()) continue;
      const [a, b] = [stems(p.title), stems(h1)];
      // Not one word in common: Google then often rewrites the title in the results, from the H1 or the text.
      if (a.size && b.size && ![...a].some((w) => b.has(w))) add(p.fetched.publicUrl, t.titleH1Apart(short(p.title, 50), short(h1, 50)));
    }
    return out;
  },
};
