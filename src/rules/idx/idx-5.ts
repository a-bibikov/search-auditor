/** IDX-5: The site has one version. */
import { finder } from "auditor-engine";
import { seoOf } from "../../collect.ts";
import { rel, statusOf, type SeoRule } from "../util.ts";

export const idx5: SeoRule = {
  id: "IDX-5",
  group: "IDX",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    const { otherHost, slashVariant } = seoOf(site);
    const host = new URL(site.base).host;
    // The other host answering 200 on its own is a second copy; no DNS record or an error is not.
    if (otherHost && otherHost.status === 200 && new URL(otherHost.finalUrl ?? otherHost.publicUrl).host !== host)
      add("site", t.otherHostAnswers(otherHost.publicUrl, statusOf(otherHost)));
    const v = slashVariant;
    if (v && v.fetched.status === 200 && !v.fetched.redirected) {
      const points = v.canonical && (v.canonical === v.main || v.canonical === v.mainCanonical);
      if (!points) add(v.main, t.slashDuplicate(rel(v.variant, site.base)));
    }
    return out;
  },
};
