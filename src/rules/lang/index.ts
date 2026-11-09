/**
 * Language versions (LANG): hreflang for multilingual sites, so search engines show each visitor their language.
 * Valid codes, each language once, full addresses, every version listing itself and the others back, an x-default,
 * targets that are working canonical pages, and a hreflang language that matches the page it points to.
 * Only on sites that use hreflang.
 */
import type { SeoRule } from "../util.ts";
import { lang1 } from "./lang-1.ts";
import { lang2 } from "./lang-2.ts";
import { lang3 } from "./lang-3.ts";
import { lang4 } from "./lang-4.ts";
import { lang5 } from "./lang-5.ts";
import { lang6 } from "./lang-6.ts";
import { lang7 } from "./lang-7.ts";
import { lang8 } from "./lang-8.ts";

export const langRules: SeoRule[] = [lang1, lang2, lang3, lang4, lang5, lang6, lang7, lang8];
