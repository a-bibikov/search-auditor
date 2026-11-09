/** SEC-1: The site works over HTTPS, and http:// redirects to it. */
import { finder } from "auditor-engine";
import { seoOf } from "../../collect.ts";
import type { SeoRule } from "../util.ts";

export const sec1: SeoRule = {
  id: "SEC-1",
  group: "SEC",
  level: "error",
  applies: (site, t) => (seoOf(site).local ? t.skipLocal : null),
  run(site, _c, t) {
    const { out, add } = finder(this);
    if (!site.base.startsWith("https://")) {
      add("site", t.notHttps);
      return out;
    }
    // Only an http:// answer that stays on http:// is a problem; a closed port 80 is not.
    const home = seoOf(site).httpHome;
    if (home && home.status > 0 && !(home.finalUrl ?? "").startsWith("https://")) add(home.publicUrl, t.httpNoRedirect(home.finalUrl ?? home.publicUrl));
    return out;
  },
};
