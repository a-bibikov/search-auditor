/**
 * Indexing (IDX): can search engines reach the pages and are they allowed to keep them in the index.
 * Status codes and soft 404s, robots.txt health and what it blocks, one version of the site, redirect chains,
 * noindex that contradicts the sitemap or the canonical, CSS and JavaScript closed to Googlebot, server speed.
 */
import type { SeoRule } from "../util.ts";
import { idx1 } from "./idx-1.ts";
import { idx2 } from "./idx-2.ts";
import { idx3 } from "./idx-3.ts";
import { idx4 } from "./idx-4.ts";
import { idx5 } from "./idx-5.ts";
import { idx6 } from "./idx-6.ts";
import { idx7 } from "./idx-7.ts";
import { idx8 } from "./idx-8.ts";
import { idx9 } from "./idx-9.ts";

export const idxRules: SeoRule[] = [idx1, idx2, idx3, idx4, idx5, idx6, idx7, idx8, idx9];
