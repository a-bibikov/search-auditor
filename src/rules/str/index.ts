/**
 * Page structure (STR): can search engines and people read what a page is about, in which language, on any screen.
 * One H1 with text, heading levels without gaps and without empty headings, a title and an H1 about the same thing,
 * the page language in <html lang> that matches the text, a viewport for mobile that still allows zoom, the main
 * content in <main>, and a doctype so browsers do not fall back to quirks mode.
 */
import type { SeoRule } from "../util.ts";
import { str1 } from "./str-1.ts";
import { str2 } from "./str-2.ts";
import { str3 } from "./str-3.ts";
import { str4 } from "./str-4.ts";
import { str5 } from "./str-5.ts";
import { str6 } from "./str-6.ts";
import { str7 } from "./str-7.ts";
import { str8 } from "./str-8.ts";
import { str9 } from "./str-9.ts";
import { str10 } from "./str-10.ts";

export const strRules: SeoRule[] = [str1, str2, str3, str4, str5, str6, str7, str8, str9, str10];
