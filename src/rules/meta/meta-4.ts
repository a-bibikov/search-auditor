/** META-4: One title and one description per page. */
import { finder } from "auditor-engine";
import { headOf } from "../../collect.ts";
import type { SeoRule } from "../util.ts";

export const meta4: SeoRule = {
  id: "META-4",
  group: "META",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      // In <head> only: an inline SVG has <title> of its own, and that is fine.
      const head = headOf(p.fetched.body);
      const titles = (head.match(/<title\b/gi) ?? []).length;
      const descriptions = (head.match(/<meta\b[^>]*\bname\s*=\s*["']?description\b/gi) ?? []).length;
      if (titles > 1) add(p.fetched.publicUrl, t.manyTitles(titles));
      if (descriptions > 1) add(p.fetched.publicUrl, t.manyDescriptions(descriptions));
    }
    return out;
  },
};
