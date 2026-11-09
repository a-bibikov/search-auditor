/** MAP-1: There is a sitemap, and robots.txt points to it. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";

export const map1: SeoRule = {
  id: "MAP-1",
  group: "MAP",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    if (!site.sitemap) add("site", t.noSitemap);
    else if (site.robots && !/^\s*sitemap\s*:/im.test(site.robots.fetched.body)) add("site", t.sitemapNotInRobots, "info");
    return out;
  },
};
