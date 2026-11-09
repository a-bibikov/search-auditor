/** Constants and helpers shared by the MAP checks. */
import { norm, type SeoRule } from "../util.ts";

export const inSitemap = (site: Parameters<SeoRule["run"]>[0]) => new Set((site.sitemap?.urls ?? []).map((u) => norm(u.loc)));

/** Where findings about the sitemap as a whole go: its first file, or the default address. */
export const sitemapUrl = (site: Parameters<SeoRule["run"]>[0], files: { url: string }[]) => files[0]?.url ?? `${site.base}/sitemap.xml`;

/** The sitemap protocol's limits per file. */
export const MAX_URLS = 50_000;
export const MAX_BYTES = 50 * 1024 * 1024;

/** W3C Datetime as the sitemap protocol takes it: a date, or a date and time with a time zone. */
export const W3C_DATE = /^\d{4}(-\d{2}(-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?)?)?$/;
/** A sitemap where at least this many addresses share one lastmod is stamping the build time, not the edits. */
export const SAME_LASTMOD_MIN = 10;
