/** SEC-3: http:// redirects to https:// permanently. */
import { finder } from "auditor-engine";
import { seoOf } from "../../collect.ts";
import type { SeoRule } from "../util.ts";
import { liveHttps } from "./shared.ts";

export const sec3: SeoRule = {
  id: "SEC-3",
  group: "SEC",
  level: "warn",
  applies: (site, t) => (seoOf(site).local ? t.skipLocal : liveHttps(site, false) ? null : t.skipNotHttps),
  run(site, _c, t) {
    const { out, add } = finder(this);
    const hop = seoOf(site).httpHop;
    // 302 and 307 say «for now»: search engines keep the http:// address and do not pass its weight on.
    if (hop && (hop.status === 302 || hop.status === 307) && hop.location.startsWith("https://"))
      add(`http://${new URL(site.base).host}/`, t.temporaryRedirect(hop.status));
    return out;
  },
};
