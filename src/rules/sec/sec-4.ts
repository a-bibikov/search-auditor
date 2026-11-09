/** SEC-4: The certificate is valid and not about to expire. */
import { finder } from "auditor-engine";
import { seoOf } from "../../collect.ts";
import type { SeoRule } from "../util.ts";
import { CERT_WARN_DAYS, liveHttps } from "./shared.ts";

export const sec4: SeoRule = {
  id: "SEC-4",
  group: "SEC",
  level: "error",
  applies: (site, t) => (seoOf(site).local ? t.skipLocal : liveHttps(site, false) ? null : t.skipNotHttps),
  run(site, _c, t) {
    const { out, add } = finder(this);
    const cert = seoOf(site).cert;
    if (!cert) return out;
    if (cert.daysLeft < 0) add("site", t.certExpired(cert.validTo));
    else if (!cert.valid) add("site", t.certInvalid(cert.error ?? "untrusted"));
    else if (cert.daysLeft < CERT_WARN_DAYS) add("site", t.certExpiring(cert.daysLeft, cert.validTo), "warn");
    return out;
  },
};
