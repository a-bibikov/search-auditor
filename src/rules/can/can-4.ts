/** CAN-4: There is one canonical per page. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";
import { canonicalTags } from "./shared.ts";

export const can4: SeoRule = {
  id: "CAN-4",
  group: "CAN",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    // Two canonicals that disagree make Google ignore both; the same one twice is untidy but harmless.
    for (const p of site.pages) {
      const hrefs = [...new Set(canonicalTags(p.fetched.body).map((c) => c.href))];
      if (hrefs.length > 1) add(p.fetched.publicUrl, t.manyCanonicals(hrefs.length, hrefs.join(", ")));
    }
    return out;
  },
};
