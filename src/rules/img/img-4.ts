/** IMG-4: Photos are served in modern formats. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";
import { imgs, NEGOTIATED } from "./shared.ts";

export const img4: SeoRule = {
  id: "IMG-4",
  group: "IMG",
  level: "info",
  applies: (site, t) => (site.pages.some((p) => p.images.length) ? null : t.skipNoImages),
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      // JPEG and PNG with no WebP or AVIF next to them; a <picture> with a modern source or an image CDN is fine.
      const old = imgs(p.fetched.body).filter((i) => /\.(jpe?g|png)(\?|#|$)/i.test(i.src) && !i.modernSource && !NEGOTIATED.test(i.src));
      if (old.length) add(p.fetched.publicUrl, t.oldFormats(old.length, old[0]!.src));
    }
    return out;
  },
};
