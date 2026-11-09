/** IDX-7: noindex does not close the home page and does not contradict the sitemap and canonical. */
import { finder } from "auditor-engine";
import { absolute, norm, rel, type SeoRule } from "../util.ts";
import { isNoindex } from "./shared.ts";

export const idx7: SeoRule = {
  id: "IDX-7",
  group: "IDX",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    const listed = new Set((site.sitemap?.urls ?? []).map((u) => norm(u.loc)));
    const byUrl = new Map(site.pages.map((p) => [norm(p.fetched.publicUrl), p]));
    for (const p of site.pages) {
      const self = norm(p.fetched.publicUrl);
      const href = p.canonical ? absolute(p.canonical, p.fetched.publicUrl) : "";
      const elsewhere = href && norm(href) !== self ? href : "";
      if (isNoindex(p) && self === norm(`${site.base}/`)) add(p.fetched.publicUrl, t.noindexHome, "error");
      else if (isNoindex(p) && listed.has(self)) add(p.fetched.publicUrl, t.noindexInSitemap);
      if (isNoindex(p) && elsewhere) add(p.fetched.publicUrl, t.noindexWithCanonical(rel(elsewhere, site.base)));
      const target = elsewhere ? byUrl.get(norm(elsewhere)) : undefined;
      if (target && isNoindex(target) && !isNoindex(p)) add(p.fetched.publicUrl, t.canonicalToNoindex(rel(elsewhere, site.base)));
    }
    return out;
  },
};
