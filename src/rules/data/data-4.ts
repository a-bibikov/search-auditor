/** DATA-4: Nested pages have breadcrumbs. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";
import { BREADCRUMB_DEPTH, depthOf, typesOf } from "./shared.ts";

export const data4: SeoRule = {
  id: "DATA-4",
  group: "DATA",
  level: "info",
  applies: (site, t) => (site.pages.some((p) => depthOf(p.fetched.publicUrl) >= BREADCRUMB_DEPTH) ? null : t.skipNoNestedPages),
  run(site, _c, t) {
    const { out, add } = finder(this);
    // Google shows the trail instead of the bare address under the title: «Blog › AI agents».
    for (const p of site.pages)
      if (depthOf(p.fetched.publicUrl) >= BREADCRUMB_DEPTH && !p.jsonLd.some((n) => typesOf(n).includes("BreadcrumbList")))
        add(p.fetched.publicUrl, t.noBreadcrumbs);
    return out;
  },
};
