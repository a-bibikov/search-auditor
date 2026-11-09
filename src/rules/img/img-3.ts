/** IMG-3: Lazy loading is used where it helps. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";
import { FIRST_SCREEN_TEXT, imgs, LAZY_FROM } from "./shared.ts";

export const img3: SeoRule = {
  id: "IMG-3",
  group: "IMG",
  level: "warn",
  applies: (site, t) => (site.pages.some((p) => p.images.length) ? null : t.skipNoImages),
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      const list = imgs(p.fetched.body);
      // The first image on the first screen is often the largest one (LCP): loading it lazily delays it.
      // One that comes after a screenful of text is further down, where lazy loading is right.
      const first = list[0];
      if (first?.loading === "lazy" && first.textBefore < FIRST_SCREEN_TEXT) add(p.fetched.publicUrl, t.firstImageLazy(first.src));
      // A long page that loads every image at once: the ones below the first screen can wait.
      if (list.length >= LAZY_FROM && !list.some((i) => i.loading === "lazy")) add(p.fetched.publicUrl, t.noLazyImages(list.length), "info");
    }
    return out;
  },
};
