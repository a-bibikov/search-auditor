/** SEC-6: The site's own addresses use https://. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";

export const sec6: SeoRule = {
  id: "SEC-6",
  group: "SEC",
  level: "warn",
  applies: (site, t) => (site.base.startsWith("https://") ? null : t.skipNotHttps),
  run(site, _c, t) {
    const { out, add } = finder(this);
    // The same host over http://: every such address costs a redirect, and a canonical to it names the wrong version.
    const insecure = `http://${new URL(site.base).host}`;
    const isInsecure = (u: string | undefined) => !!u && (u === insecure || u.startsWith(insecure + "/"));
    for (const p of site.pages) {
      const where = p.fetched.publicUrl;
      if (isInsecure(p.canonical)) add(where, t.httpAddress("canonical", p.canonical));
      for (const h of p.hreflang) if (isInsecure(h.href)) add(where, t.httpAddress(`hreflang ${h.lang}`, h.href));
      for (const key of ["url", "image"]) if (isInsecure(p.og[key])) add(where, t.httpAddress(`og:${key}`, p.og[key]!));
      const links = p.links.filter(isInsecure);
      if (links.length) add(where, t.httpLinks(links.length, links[0]!));
    }
    const listed = (site.sitemap?.urls ?? []).filter((u) => isInsecure(u.loc));
    if (listed.length) add(`${site.base}/sitemap.xml`, t.httpInSitemap(listed.length, listed[0]!.loc));
    return out;
  },
};
