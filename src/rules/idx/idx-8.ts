/** IDX-8: robots.txt does not block CSS and JavaScript. */
import { finder, isSameSite } from "auditor-engine";
import { rel, type SeoRule } from "../util.ts";
import { pathOf } from "./shared.ts";

export const idx8: SeoRule = {
  id: "IDX-8",
  group: "IDX",
  level: "warn",
  applies: (site, t) => (site.robots ? null : t.skipNoRobots),
  run(site, _c, t) {
    const { out, add } = finder(this);
    const o = { target: site.target, base: site.base };
    const robots = site.robots!.parsed;
    const seen = new Set<string>();
    for (const p of site.pages)
      for (const res of p.resources) {
        if (seen.has(res) || !isSameSite(res, o) || !/\.(css|js|mjs)(\?|$)/i.test(new URL(res).pathname)) continue;
        seen.add(res);
        if (!robots.allows("Googlebot", pathOf(res))) add(p.fetched.publicUrl, t.blockedResource(rel(res, site.base)));
      }
    return out;
  },
};
