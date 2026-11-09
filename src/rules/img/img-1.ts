/** IMG-1: Images have alt text. */
import { finder } from "auditor-engine";
import { rel, type SeoRule } from "../util.ts";

export const img1: SeoRule = {
  id: "IMG-1",
  group: "IMG",
  level: "warn",
  applies: (site, t) => (site.pages.some((p) => p.images.length) ? null : t.skipNoImages),
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      const missing = p.images.filter((i) => i.alt === null);
      if (missing.length) add(p.fetched.publicUrl, t.imagesNoAlt(missing.length, p.images.length, rel(missing[0]!.src, site.base)));
    }
    return out;
  },
};
