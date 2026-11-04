import type { Lang } from "ai-search-auditor";
import { en, type SeoMessages, type SeoRuleId } from "./en.ts";
import { ru } from "./ru.ts";

export type { SeoMessages, SeoRuleId };

/** SEO texts per report language. The list of languages follows ai-search-auditor, so both halves of a report match. */
export const SEO_LANGS = { en, ru } satisfies Record<Lang, SeoMessages>;

export const seoMessages = (lang: Lang = "en"): SeoMessages => SEO_LANGS[lang];
