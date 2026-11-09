/** IDX-9: The server answers quickly. */
import { finder } from "auditor-engine";
import { seoOf } from "../../collect.ts";
import type { SeoRule } from "../util.ts";
import { TTFB, median } from "./shared.ts";

export const idx9: SeoRule = {
  id: "IDX-9",
  group: "IDX",
  level: "info",
  applies: (site, t) => (seoOf(site).local ? t.skipLocal : null),
  run(site, _c, t) {
    const { out, add } = finder(this);
    const times = seoOf(site).ttfb;
    if (!times?.length) return out;
    const ms = median(times);
    if (ms > TTFB.poor) add(`${site.base}/`, t.slowServer(ms, TTFB.slow), "warn");
    else if (ms > TTFB.slow) add(`${site.base}/`, t.slowServer(ms, TTFB.slow));
    return out;
  },
};
