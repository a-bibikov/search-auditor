/**
 * Sitemap (MAP): the map of the site for search engines, and whether it lists the right pages the right way.
 * A valid sitemap file declared in robots.txt; full addresses on this site that answer 200 without redirects;
 * only pages that are their own canonical; the pages the site links to; and lastmod dates search engines can trust.
 */
import type { SeoRule } from "../util.ts";
import { map1 } from "./map-1.ts";
import { map2 } from "./map-2.ts";
import { map3 } from "./map-3.ts";
import { map4 } from "./map-4.ts";
import { map5 } from "./map-5.ts";
import { map6 } from "./map-6.ts";
import { map7 } from "./map-7.ts";
import { map8 } from "./map-8.ts";

export const mapRules: SeoRule[] = [map1, map2, map3, map4, map5, map6, map7, map8];
