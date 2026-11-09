/** IDX-6: Redirects take one step. */
import { finder } from "auditor-engine";
import { seoOf } from "../../collect.ts";
import { rel, type SeoRule } from "../util.ts";

export const idx6: SeoRule = {
  id: "IDX-6",
  group: "IDX",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const c of seoOf(site).chains) {
      const path = [c.url, ...c.hops].map((u) => rel(u, site.base)).join(" → ");
      const url = rel(c.url, site.base);
      // Reported where the address is used: the linking pages or the sitemap; else on the address itself.
      const places = c.from.length ? c.from.map((f) => (f === "sitemap.xml" ? `${site.base}/sitemap.xml` : f)) : [c.url];
      for (const place of places) {
        if (c.loop) add(place, t.redirectLoop(url, path), "error");
        else if (c.hops.length > 1) add(place, t.redirectChain(url, c.hops.length, path));
      }
    }
    return out;
  },
};
