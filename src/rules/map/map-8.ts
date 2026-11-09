/** MAP-8: lastmod in the sitemap is honest. */
import { finder } from "auditor-engine";
import { seoOf } from "../../collect.ts";
import { short, type SeoRule } from "../util.ts";
import { SAME_LASTMOD_MIN, W3C_DATE, sitemapUrl } from "./shared.ts";

export const map8: SeoRule = {
  id: "MAP-8",
  group: "MAP",
  level: "warn",
  applies: (site, t) => (site.sitemap?.urls.some((u) => u.lastmod) ? null : t.skipNoLastmod),
  run(site, _c, t) {
    const { out, add } = finder(this);
    const where = sitemapUrl(site, seoOf(site).sitemapFiles);
    const dates = site.sitemap!.urls.map((u) => u.lastmod).filter((d): d is string => Boolean(d));
    const bad = dates.filter((d) => !W3C_DATE.test(d) || Number.isNaN(Date.parse(d)));
    // A day of slack for time zones: a date tomorrow in UTC can be today on the server.
    const future = dates.filter((d) => W3C_DATE.test(d) && Date.parse(d) > Date.now() + 86_400_000);
    if (bad.length) add(where, t.lastmodBad(bad.length, short(bad[0]!, 40)));
    if (future.length) add(where, t.lastmodFuture(future.length, future[0]!));
    // The same lastmod everywhere is the build time: Google learns to ignore it, and real edits go unnoticed.
    const counts = new Map<string, number>();
    for (const d of dates) counts.set(d, (counts.get(d) ?? 0) + 1);
    const [top, n] = [...counts].sort((a, b) => b[1] - a[1])[0] ?? ["", 0];
    if (n >= SAME_LASTMOD_MIN && n === site.sitemap!.urls.length) add(where, t.lastmodSame(n, top));
    return out;
  },
};
