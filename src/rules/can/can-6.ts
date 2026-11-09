/** CAN-6: The canonical in the HTML and in the HTTP header agree. */
import { finder } from "auditor-engine";
import { absolute, rel, type SeoRule } from "../util.ts";
import { headerCanonical } from "./shared.ts";

export const can6: SeoRule = {
  id: "CAN-6",
  group: "CAN",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      const header = headerCanonical(p);
      if (!header || !p.canonical) continue;
      const fromHeader = absolute(header, p.fetched.publicUrl);
      const fromHtml = absolute(p.canonical, p.fetched.publicUrl);
      if (fromHeader !== fromHtml) add(p.fetched.publicUrl, t.canonicalConflict(rel(fromHtml, site.base), rel(fromHeader, site.base)));
    }
    return out;
  },
};
