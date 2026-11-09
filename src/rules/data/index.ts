/**
 * Structured data (DATA): does the JSON-LD on the pages parse and say enough for rich results in search.
 * No syntax errors, @context and @type on every entity, the properties Google requires for rich-result types,
 * breadcrumbs on nested pages, full addresses and ISO dates, and the site name in WebSite on the home page.
 * What the markup says about authorship, articles and FAQs is checked by the AI search rules (C group).
 */
import type { SeoRule } from "../util.ts";
import { data1 } from "./data-1.ts";
import { data2 } from "./data-2.ts";
import { data3 } from "./data-3.ts";
import { data4 } from "./data-4.ts";
import { data5 } from "./data-5.ts";
import { data6 } from "./data-6.ts";

export const dataRules: SeoRule[] = [data1, data2, data3, data4, data5, data6];
