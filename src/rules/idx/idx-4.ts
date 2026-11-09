/** IDX-4: robots.txt does not block the pages of the site: those in the sitemap and the audited ones. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";
import { norm } from "../util.ts";
import { SEARCH_BOTS, pathOf } from "./shared.ts";

export const idx4: SeoRule = {
  id: "IDX-4",
  group: "IDX",
  level: "error",
  applies: (site, t) => (site.robots ? null : t.skipNoRobots),
  run(site, _c, t) {
    const { out, add } = finder(this);
    const robots = site.robots!.parsed;
    const blockedFor = (url: string) => {
      try {
        const path = pathOf(url);
        return SEARCH_BOTS.filter((bot) => !robots.allows(bot, path));
      } catch {
        return [];
      }
    };
    const listed = new Set<string>();
    for (const { loc } of site.sitemap?.urls ?? []) {
      listed.add(norm(loc));
      const blocked = blockedFor(loc);
      if (blocked.length) add(loc, t.blockedBySitemap(blocked.join(", ")));
    }
    // Without a sitemap, or for pages it does not list: the pages the site links to are meant to be found too.
    for (const p of site.pages) {
      const url = p.fetched.publicUrl;
      if (listed.has(norm(url))) continue;
      const blocked = blockedFor(url);
      if (blocked.length) add(url, t.blockedPage(blocked.join(", ")));
    }
    return out;
  },
};
