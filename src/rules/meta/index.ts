/**
 * Meta tags (META): how a page looks in search results, its title, snippet and icon.
 * One title and one description per page, of a length that fits the result, written for the page and not for a
 * template, not repeated across pages or between title and description; a declared encoding, a snippet that is
 * not forbidden, and a favicon.
 */
import type { SeoRule } from "../util.ts";
import { meta1 } from "./meta-1.ts";
import { meta2 } from "./meta-2.ts";
import { meta3 } from "./meta-3.ts";
import { meta4 } from "./meta-4.ts";
import { meta5 } from "./meta-5.ts";
import { meta6 } from "./meta-6.ts";
import { meta7 } from "./meta-7.ts";
import { meta8 } from "./meta-8.ts";
import { meta9 } from "./meta-9.ts";

export const metaRules: SeoRule[] = [meta1, meta2, meta3, meta4, meta5, meta6, meta7, meta8, meta9];
