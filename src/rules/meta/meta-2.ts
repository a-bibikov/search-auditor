/** META-2: Every page has a description. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";
import { DESCRIPTION, len } from "./shared.ts";

export const meta2: SeoRule = {
  id: "META-2",
  group: "META",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      const n = len(p.description);
      if (!n) add(p.fetched.publicUrl, t.noDescription);
      else if (n < DESCRIPTION.min || n > DESCRIPTION.max) add(p.fetched.publicUrl, t.descriptionLength(n, DESCRIPTION.min, DESCRIPTION.max), "info");
    }
    return out;
  },
};
