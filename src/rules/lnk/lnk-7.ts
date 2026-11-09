/** LNK-7: Links to other sites still work. */
import { finder } from "auditor-engine";
import { seoOf } from "../../collect.ts";
import { statusOf, type SeoRule } from "../util.ts";
import { GONE } from "./shared.ts";

export const lnk7: SeoRule = {
  id: "LNK-7",
  group: "LNK",
  level: "warn",
  applies(site, t) {
    const external = [...seoOf(site).external.values()];
    if (!external.length) return t.skipNoExternal;
    // Not one outside site answered at all: the audit runs without internet access, so nothing can be told dead.
    return external.some((p) => p.status > 0) ? null : t.skipNoNetwork;
  },
  run(site, _c, t) {
    const { out, add } = finder(this);
    // Only answers that mean «gone»: many sites turn bots away with 403, 429 or 999, and that is not a dead link.
    for (const [url, p] of seoOf(site).external)
      if (p.status === 404 || p.status === 410 || (p.status === 0 && GONE.test(p.error ?? "")))
        for (const page of p.from ?? []) add(page, t.deadExternal(url, statusOf(p)));
    return out;
  },
};
