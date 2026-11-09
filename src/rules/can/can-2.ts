/** CAN-2: The canonical is an absolute address on this site. */
import { finder, isSameSite } from "auditor-engine";
import type { SeoRule } from "../util.ts";

export const can2: SeoRule = {
  id: "CAN-2",
  group: "CAN",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    const o = { target: site.target, base: site.base };
    for (const p of site.pages) {
      if (!p.canonical) continue;
      if (!/^https?:\/\//i.test(p.canonical)) add(p.fetched.publicUrl, t.relativeCanonical(p.canonical));
      else if (!isSameSite(p.canonical, o)) add(p.fetched.publicUrl, t.foreignCanonical(p.canonical));
    }
    return out;
  },
};
