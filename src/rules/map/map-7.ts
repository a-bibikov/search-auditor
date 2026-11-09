/** MAP-7: Every sitemap address answers. */
import { finder } from "auditor-engine";
import { seoOf } from "../../collect.ts";
import { statusOf, type SeoRule } from "../util.ts";

export const map7: SeoRule = {
  id: "MAP-7",
  group: "MAP",
  level: "error",
  applies: (site, t) => (site.sitemap ? null : t.skipNoSitemap),
  run(site, _c, t) {
    const { out, add } = finder(this);
    // The sampled pages are IDX-1's: these are the sitemap addresses beyond the sample.
    for (const [url, p] of seoOf(site).sitemapExtra) if (p.status === 0 || p.status >= 400) add(url, t.sitemapDead(statusOf(p)));
    return out;
  },
};
