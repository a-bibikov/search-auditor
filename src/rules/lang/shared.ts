/** Constants and helpers shared by the LANG checks. */
import type { SeoRule } from "../util.ts";

/** ISO 639-1 language, optional ISO 15924 script and region (ISO 3166-1 or UN M.49), or x-default. */
export const HREFLANG = /^(x-default|[a-z]{2,3}(-[a-z]{4})?(-([a-z]{2}|\d{3}))?)$/i;

export const hasHreflang = (site: Parameters<SeoRule["run"]>[0]) => site.pages.some((p) => p.hreflang.length);

/** The language of a code or of <html lang>, without script and region: «en» for en-GB, «zh» for zh-Hant. */
export const primary = (code: string) => code.trim().toLowerCase().split(/[-_]/)[0] ?? "";
