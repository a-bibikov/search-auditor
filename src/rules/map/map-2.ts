/** MAP-2: Sitemap addresses do not redirect. */
import { finder } from "auditor-engine";
import { seoOf } from "../../collect.ts";
import { norm, rel, type SeoRule } from "../util.ts";
import { inSitemap } from "./shared.ts";

export const map2: SeoRule = {
  id: "MAP-2",
  group: "MAP",
  level: "warn",
  applies: (site, t) => (site.sitemap ? null : t.skipNoSitemap),
  run(site, _c, t) {
    const { out, add } = finder(this);
    const listed = inSitemap(site);
    for (const f of [...site.pages.map((p) => p.fetched), ...site.failed]) {
      if (!listed.has(norm(f.publicUrl)) || !f.redirected || !f.finalUrl) continue;
      if (norm(f.finalUrl) !== norm(f.publicUrl)) add(f.publicUrl, t.sitemapRedirects(rel(f.finalUrl, site.base)));
    }
    // And the sitemap addresses beyond the sample, requested in collect().
    for (const [url, p] of seoOf(site).sitemapExtra)
      if (p.status > 0 && p.status < 400 && p.redirected && norm(p.finalUrl) !== url) add(url, t.sitemapRedirects(rel(p.finalUrl, site.base)));
    return out;
  },
};
