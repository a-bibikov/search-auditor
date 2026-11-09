/** STR-7: The page can be zoomed on a phone. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";

export const str7: SeoRule = {
  id: "STR-7",
  group: "STR",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      const v = p.viewport;
      const max = Number(v.match(/maximum-scale\s*=\s*([\d.]+)/i)?.[1] ?? NaN);
      // Zoom up to 2× at least: below that, people with weaker sight cannot read the page.
      if (/user-scalable\s*=\s*(no|0)\b/i.test(v) || max < 2) add(p.fetched.publicUrl, t.noZoom(v));
    }
    return out;
  },
};
