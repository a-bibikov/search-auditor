/** IMG-2: Images have width and height. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";
import { imgs } from "./shared.ts";

export const img2: SeoRule = {
  id: "IMG-2",
  group: "IMG",
  level: "warn",
  applies: (site, t) => (site.pages.some((p) => p.images.length) ? null : t.skipNoImages),
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      // Without both, the browser cannot reserve space, and the layout jumps as images arrive (CLS).
      const list = imgs(p.fetched.body);
      const unsized = list.filter((i) => !i.width || !i.height);
      if (unsized.length) add(p.fetched.publicUrl, t.imagesNoSize(unsized.length, list.length, unsized[0]!.src));
    }
    return out;
  },
};
