/** MAP-3: Sitemap pages are their own canonical. */
import { finder } from "auditor-engine";
import { absolute, norm, rel, type SeoRule } from "../util.ts";
import { inSitemap } from "./shared.ts";

export const map3: SeoRule = {
  id: "MAP-3",
  group: "MAP",
  level: "warn",
  applies: (site, t) => (site.sitemap ? null : t.skipNoSitemap),
  run(site, _c, t) {
    const { out, add } = finder(this);
    const listed = inSitemap(site);
    for (const p of site.pages) {
      const f = p.fetched;
      // A listed address that redirects is MAP-2's finding; its target's canonical says nothing new.
      if (!listed.has(norm(f.publicUrl)) || (f.finalUrl && norm(f.finalUrl) !== norm(f.publicUrl))) continue;
      const href = p.canonical ? absolute(p.canonical, f.publicUrl) : "";
      if (href && norm(href) !== norm(f.publicUrl)) add(f.publicUrl, t.sitemapCanonicalElsewhere(rel(href, site.base)));
    }
    return out;
  },
};
