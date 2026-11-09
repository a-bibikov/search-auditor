/** CAN-9: A language version does not name another language as canonical. */
import { finder } from "auditor-engine";
import { absolute, norm, rel, type SeoRule } from "../util.ts";
import { langOf } from "./shared.ts";

export const can9: SeoRule = {
  id: "CAN-9",
  group: "CAN",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    const byUrl = new Map(site.pages.map((p) => [norm(p.fetched.publicUrl), p]));
    for (const p of site.pages) {
      const href = p.canonical ? absolute(p.canonical, p.fetched.publicUrl) : "";
      const target = href ? byUrl.get(norm(href)) : undefined;
      if (!target || target === p) continue;
      const [from, to] = [langOf(p), langOf(target)];
      // Translations are separate pages joined by hreflang; a canonical across languages drops this one from search.
      if (from && to && from !== to) add(p.fetched.publicUrl, t.canonicalOtherLanguage(rel(href, site.base), to, from));
    }
    return out;
  },
};
