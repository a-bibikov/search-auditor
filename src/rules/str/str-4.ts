/** STR-4: Pages are set up for mobile. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";

export const str4: SeoRule = {
  id: "STR-4",
  group: "STR",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) if (!/width\s*=\s*device-width/i.test(p.viewport)) add(p.fetched.publicUrl, t.noViewport);
    return out;
  },
};
