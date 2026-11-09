/** META-5: The title names the page, not a template. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";
import { GENERIC_TITLE } from "./shared.ts";

export const meta5: SeoRule = {
  id: "META-5",
  group: "META",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      const title = p.title.trim();
      if (title && GENERIC_TITLE.test(title)) add(p.fetched.publicUrl, t.genericTitle(title));
    }
    return out;
  },
};
