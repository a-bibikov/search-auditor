import { linkRules } from "./links.ts";
import { pageRules } from "./page.ts";
import { siteRules } from "./site.ts";
import type { SeoRule } from "./util.ts";

export type { SeoRule };

/** Group ids in checklist order: the order a site owner fixes things in. */
export const SEO_GROUPS = ["IDX", "SEC", "CAN", "MAP", "META", "STR", "LNK", "IMG", "DATA", "LANG"] as const;

const all = [...siteRules, ...pageRules, ...linkRules];
export const seoRules: SeoRule[] = SEO_GROUPS.flatMap((g) => all.filter((r) => r.group === g));
