/** IMG-7: Alt text describes the image. */
import { finder } from "auditor-engine";
import { short, type SeoRule } from "../util.ts";
import { imgs, MAX_ALT, POOR_ALT } from "./shared.ts";

export const img7: SeoRule = {
  id: "IMG-7",
  group: "IMG",
  level: "info",
  applies: (site, t) => (site.pages.some((p) => p.images.length) ? null : t.skipNoImages),
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      // An empty alt is a deliberate «decorative»; a file name, «image» or a whole paragraph is not a description.
      const poor = imgs(p.fetched.body)
        .map((i) => (i.alt ?? "").trim())
        .filter((alt) => alt && (POOR_ALT.test(alt) || alt.length > MAX_ALT));
      if (poor.length) add(p.fetched.publicUrl, t.poorAlt(poor.length, short(poor[0]!, 40)));
    }
    return out;
  },
};
