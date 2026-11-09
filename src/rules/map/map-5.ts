/** MAP-5: Sitemap addresses are absolute and on this site. */
import { finder } from "auditor-engine";
import { seoOf } from "../../collect.ts";
import type { SeoRule } from "../util.ts";
import { sitemapUrl } from "./shared.ts";

export const map5: SeoRule = {
  id: "MAP-5",
  group: "MAP",
  level: "warn",
  applies: (site, t) => (site.sitemap ? null : t.skipNoSitemap),
  run(site, _c, t) {
    const { out, add } = finder(this);
    // The protocol takes full addresses on the sitemap's own host; others are dropped. http:// on this host is SEC-6.
    const host = new URL(site.base).host;
    const wrong = site.sitemap!.urls
      .map((u) => u.loc)
      .filter((loc) => {
        try {
          return !/^https?:\/\//i.test(loc) || new URL(loc).host !== host;
        } catch {
          return true;
        }
      });
    if (wrong.length) add(sitemapUrl(site, seoOf(site).sitemapFiles), t.sitemapForeign(wrong.length, wrong[0]!));
    return out;
  },
};
