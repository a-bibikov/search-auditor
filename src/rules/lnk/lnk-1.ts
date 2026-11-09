/** LNK-1: Internal links work. */
import { finder } from "auditor-engine";
import { seoOf } from "../../collect.ts";
import { rel, statusOf, type SeoRule } from "../util.ts";

export const lnk1: SeoRule = {
  id: "LNK-1",
  group: "LNK",
  level: "error",
  applies: (site, t) => (seoOf(site).linksFound ? null : t.skipNoLinks),
  run(site, _c, t) {
    const { out, add } = finder(this);
    const { links, linksFound, linksChecked } = seoOf(site);
    // Reported on the pages that have the link: that is where it gets fixed.
    for (const [url, p] of links)
      if (p.status === 0 || p.status >= 400) for (const page of p.from ?? [site.base]) add(page, t.brokenLink(rel(url, site.base), statusOf(p)));
    if (linksChecked < linksFound) add("site", t.linksNotChecked(linksChecked, linksFound), "info");
    return out;
  },
};
