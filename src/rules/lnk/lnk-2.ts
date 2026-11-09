/** LNK-2: Internal links do not go through redirects. */
import { finder } from "auditor-engine";
import { seoOf } from "../../collect.ts";
import { norm, rel, type SeoRule } from "../util.ts";

export const lnk2: SeoRule = {
  id: "LNK-2",
  group: "LNK",
  level: "warn",
  applies: (site, t) => (seoOf(site).linksFound ? null : t.skipNoLinks),
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const [url, p] of seoOf(site).links)
      if (p.status > 0 && p.status < 400 && p.redirected && norm(p.finalUrl) !== norm(url))
        for (const page of p.from ?? [site.base]) add(page, t.redirectLink(rel(url, site.base), rel(p.finalUrl, site.base)));
    return out;
  },
};
