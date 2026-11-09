/** LNK-3: Every page is linked from another page. */
import { finder, isSameSite } from "auditor-engine";
import { norm, type SeoRule } from "../util.ts";

/** Every same-site sitemap address was audited: only then is «no page links here» a fact, not a gap in the sample. */
const fullyAudited = (site: Parameters<SeoRule["run"]>[0]) => {
  const o = { target: site.target, base: site.base };
  const audited = new Set([...site.pages.map((p) => p.fetched.publicUrl), ...site.failed.map((f) => f.publicUrl)].map(norm));
  const listed = (site.sitemap?.urls ?? []).map((u) => u.loc).filter((u) => isSameSite(u, o));
  return listed.length > 0 && listed.every((u) => audited.has(norm(u)));
};

export const lnk3: SeoRule = {
  id: "LNK-3",
  group: "LNK",
  level: "warn",
  applies: (site, t) => (!site.sitemap ? t.skipNoSitemap : fullyAudited(site) ? null : t.skipPartialSample),
  run(site, _c, t) {
    const { out, add } = finder(this);
    const home = norm(`${site.base}/`);
    const linked = new Set<string>();
    for (const p of site.pages) for (const href of p.links) if (norm(href) !== norm(p.fetched.publicUrl)) linked.add(norm(href));
    // A page no other page links to is found only through the sitemap, and gets no weight from the site.
    for (const p of site.pages) {
      const self = norm(p.fetched.publicUrl);
      if (self !== home && !linked.has(self)) add(p.fetched.publicUrl, t.orphan);
    }
    return out;
  },
};
