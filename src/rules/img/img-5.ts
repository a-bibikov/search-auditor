/** IMG-5: Images open. */
import { finder } from "auditor-engine";
import { seoOf } from "../../collect.ts";
import { rel, statusOf, type SeoRule } from "../util.ts";

export const img5: SeoRule = {
  id: "IMG-5",
  group: "IMG",
  level: "error",
  applies: (site, t) => (seoOf(site).images.size ? null : t.skipNoOwnImages),
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const [url, p] of seoOf(site).images)
      if (p.status === 0 || p.status >= 400) for (const page of p.from ?? []) add(page, t.brokenImage(rel(url, site.base), statusOf(p)));
    return out;
  },
};
