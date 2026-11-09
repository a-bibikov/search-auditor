/** CAN-8: An address with UTM parameters names the clean address as canonical. */
import { finder } from "auditor-engine";
import { seoOf, UTM } from "../../collect.ts";
import { norm, rel, type SeoRule } from "../util.ts";

export const can8: SeoRule = {
  id: "CAN-8",
  group: "CAN",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    const utm = seoOf(site).utm;
    // A page without any canonical is CAN-1's finding; this one is about a canonical that copies the parameters.
    const main = site.pages.find((p) => p.fetched.publicUrl === utm?.page);
    if (!utm || utm.status !== 200 || !main?.canonical) return out;
    const tagged = UTM.split("&")[0]!;
    if (!utm.canonical) add(utm.page, t.utmNoCanonical(rel(utm.url, site.base)));
    else if (utm.canonical.includes(tagged) || norm(utm.canonical) === norm(utm.url)) add(utm.page, t.utmCanonical(rel(utm.url, site.base)));
    return out;
  },
};
