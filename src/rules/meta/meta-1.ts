/** META-1: Every page has a title of the right length. */
import { finder } from "auditor-engine";
import { short, type SeoRule } from "../util.ts";
import { TITLE, len } from "./shared.ts";

export const meta1: SeoRule = {
  id: "META-1",
  group: "META",
  level: "error",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      const n = len(p.title);
      if (!n) add(p.fetched.publicUrl, t.noTitle);
      else if (n < TITLE.min || n > TITLE.max) add(p.fetched.publicUrl, t.titleLength(n, short(p.title), TITLE.min, TITLE.max), "warn");
    }
    return out;
  },
};
