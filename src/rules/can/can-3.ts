/** CAN-3: The canonical leads to a page that works. */
import { finder, isSameSite } from "auditor-engine";
import { seoOf } from "../../collect.ts";
import { absolute, norm, rel, statusOf, type SeoRule } from "../util.ts";

export const can3: SeoRule = {
  id: "CAN-3",
  group: "CAN",
  level: "error",
  run(site, _c, t) {
    const { out, add } = finder(this);
    const { canonicals } = seoOf(site);
    const o = { target: site.target, base: site.base };
    // A canonical pointing at a sampled page is known from the crawl; others were requested in collect().
    const sampled = new Map(site.pages.map((p) => [norm(p.fetched.publicUrl), p.fetched]));
    const failed = new Map(site.failed.map((f) => [norm(f.publicUrl), f]));
    for (const p of site.pages) {
      const href = p.canonical ? absolute(p.canonical, p.fetched.publicUrl) : "";
      if (!href || !isSameSite(href, o)) continue;
      const key = norm(href);
      const known = sampled.get(key) ?? failed.get(key);
      const probe = known ? { status: known.status, error: known.error, redirected: Boolean(known.redirected), finalUrl: known.finalUrl ?? known.publicUrl } : canonicals.get(key);
      if (!probe) continue;
      if (probe.status !== 200) add(p.fetched.publicUrl, t.canonicalStatus(rel(href, site.base), statusOf(probe)));
      else if (probe.redirected && norm(probe.finalUrl) !== key) add(p.fetched.publicUrl, t.canonicalRedirects(rel(href, site.base), rel(probe.finalUrl, site.base)), "warn");
    }
    return out;
  },
};
