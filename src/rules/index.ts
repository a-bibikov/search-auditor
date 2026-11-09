import { canRules } from "./can/index.ts";
import { dataRules } from "./data/index.ts";
import { idxRules } from "./idx/index.ts";
import { imgRules } from "./img/index.ts";
import { langRules } from "./lang/index.ts";
import { lnkRules } from "./lnk/index.ts";
import { mapRules } from "./map/index.ts";
import { metaRules } from "./meta/index.ts";
import { secRules } from "./sec/index.ts";
import { strRules } from "./str/index.ts";
import type { SeoRule } from "./util.ts";

export type { SeoRule };

/** Group ids in checklist order: the order a site owner fixes things in. One module per group, named after it. */
export const SEO_GROUPS = ["IDX", "SEC", "CAN", "MAP", "META", "STR", "LNK", "IMG", "DATA", "LANG"] as const;

export const seoRules: SeoRule[] = [
  ...idxRules,
  ...secRules,
  ...canRules,
  ...mapRules,
  ...metaRules,
  ...strRules,
  ...lnkRules,
  ...imgRules,
  ...dataRules,
  ...langRules,
];
