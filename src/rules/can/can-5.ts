/** CAN-5: The canonical sits in <head>. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";
import { canonicalTags } from "./shared.ts";

export const can5: SeoRule = {
  id: "CAN-5",
  group: "CAN",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      const inBody = canonicalTags(p.fetched.body).find((c) => !c.inHead);
      if (inBody) add(p.fetched.publicUrl, t.canonicalInBody(inBody.href));
    }
    return out;
  },
};
