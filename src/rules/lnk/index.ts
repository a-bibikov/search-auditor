/**
 * Links (LNK): how the pages link to each other, and whether those links work for people and crawlers.
 * No broken links and no links through redirects; every page linked from another (on a full audit); links a crawler
 * can follow, without nofollow on the site's own pages, with text that says where they go; and links to other sites
 * that still exist. Problems are reported on the page that has the link: that is where they get fixed.
 */
import type { SeoRule } from "../util.ts";
import { lnk1 } from "./lnk-1.ts";
import { lnk2 } from "./lnk-2.ts";
import { lnk3 } from "./lnk-3.ts";
import { lnk4 } from "./lnk-4.ts";
import { lnk5 } from "./lnk-5.ts";
import { lnk6 } from "./lnk-6.ts";
import { lnk7 } from "./lnk-7.ts";

export const lnkRules: SeoRule[] = [lnk1, lnk2, lnk3, lnk4, lnk5, lnk6, lnk7];
