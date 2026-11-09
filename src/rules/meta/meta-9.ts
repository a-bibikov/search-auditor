/** META-9: The site has a favicon. */
import { finder } from "auditor-engine";
import { seoOf } from "../../collect.ts";
import type { SeoRule } from "../util.ts";

export const meta9: SeoRule = {
  id: "META-9",
  group: "META",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    // Checked only when the home page declares no icon: then /favicon.ico must be an image.
    const f = seoOf(site).favicon;
    if (f && (f.status !== 200 || !/^image\//i.test(f.headers.get("content-type") ?? "image/")))
      add(`${site.base}/`, t.noFavicon(f.status ? String(f.status) : (f.error ?? "no answer")));
    return out;
  },
};
