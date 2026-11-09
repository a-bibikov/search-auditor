/** CAN-1: Every page has a canonical. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";

export const can1: SeoRule = {
  id: "CAN-1",
  group: "CAN",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) if (!p.canonical) add(p.fetched.publicUrl, t.noCanonical);
    return out;
  },
};
