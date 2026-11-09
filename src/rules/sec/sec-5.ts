/** SEC-5: The server asks browsers to use only https (HSTS). */
import { finder } from "auditor-engine";
import { seoOf } from "../../collect.ts";
import type { SeoRule } from "../util.ts";
import { HSTS_MIN_AGE, homeOf, liveHttps } from "./shared.ts";

export const sec5: SeoRule = {
  id: "SEC-5",
  group: "SEC",
  level: "warn",
  applies: (site, t) => (seoOf(site).local ? t.skipLocal : liveHttps(site, false) ? null : t.skipNotHttps),
  run(site, _c, t) {
    const { out, add } = finder(this);
    const home = homeOf(site);
    if (!home) return out;
    const hsts = home.fetched.headers.get("strict-transport-security") ?? "";
    const age = Number(hsts.match(/max-age\s*=\s*"?(\d+)/i)?.[1] ?? NaN);
    if (!hsts) add(home.fetched.publicUrl, t.noHsts);
    else if (!(age >= HSTS_MIN_AGE)) add(home.fetched.publicUrl, t.shortHsts(Number.isFinite(age) ? Math.round(age / 86_400) : 0), "info");
    return out;
  },
};
