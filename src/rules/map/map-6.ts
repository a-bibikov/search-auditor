/** MAP-6: Pages the site links to are in the sitemap. */
import { finder } from "auditor-engine";
import { seoOf } from "../../collect.ts";
import type { SeoRule } from "../util.ts";
import { inSitemap } from "./shared.ts";

export const map6: SeoRule = {
  id: "MAP-6",
  group: "MAP",
  level: "info",
  applies: (site, t) => (site.sitemap ? null : t.skipNoSitemap),
  run(site, _c, t) {
    const { out, add } = finder(this);
    const listed = inSitemap(site);
    // Working HTML pages open to indexing only: a link that redirects or fails is LNK's finding; feeds, PDFs,
    // pages with noindex and addresses with a query are not meant for the sitemap.
    for (const [url, p] of seoOf(site).links) {
      if (p.status !== 200 || p.redirected || !p.html || p.noindex || url.includes("?") || listed.has(url)) continue;
      add(url, t.notInSitemap(p.from?.length ?? 0));
    }
    return out;
  },
};
