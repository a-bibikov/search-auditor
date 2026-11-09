/** SEC-7: Basic security headers are set. */
import { finder } from "auditor-engine";
import { seoOf } from "../../collect.ts";
import type { SeoRule } from "../util.ts";
import { homeOf } from "./shared.ts";

export const sec7: SeoRule = {
  id: "SEC-7",
  group: "SEC",
  level: "info",
  applies: (site, t) => (seoOf(site).local ? t.skipLocal : null),
  run(site, _c, t) {
    const { out, add } = finder(this);
    const home = homeOf(site);
    if (!home) return out;
    const h = home.fetched.headers;
    const csp = h.get("content-security-policy") ?? "";
    const missing = [
      !/nosniff/i.test(h.get("x-content-type-options") ?? "") && "X-Content-Type-Options: nosniff",
      !h.get("x-frame-options") && !/frame-ancestors/i.test(csp) && "X-Frame-Options / CSP frame-ancestors",
      !h.get("referrer-policy") && "Referrer-Policy",
    ].filter((x): x is string => Boolean(x));
    if (missing.length) add(home.fetched.publicUrl, t.missingHeaders(missing.join(", ")));
    return out;
  },
};
