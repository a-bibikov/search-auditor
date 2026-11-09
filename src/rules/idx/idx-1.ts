/** IDX-1: Pages answer 200. */
import { finder } from "auditor-engine";
import { statusOf, type SeoRule } from "../util.ts";

export const idx1: SeoRule = {
  id: "IDX-1",
  group: "IDX",
  level: "error",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const f of site.failed) if (f.status !== 200) add(f.publicUrl, t.status(statusOf(f)));
    return out;
  },
};
