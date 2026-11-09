/** CAN-7: A canonical leads straight to the main page, not through another canonical. */
import { finder, isSameSite } from "auditor-engine";
import { seoOf } from "../../collect.ts";
import { absolute, norm, rel, type SeoRule } from "../util.ts";

export const can7: SeoRule = {
  id: "CAN-7",
  group: "CAN",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    const o = { target: site.target, base: site.base };
    // The canonical each target declares: from the crawl for sampled pages, from collect() for the others.
    const declared = new Map<string, string>();
    // A target that redirects is CAN-3's finding: what the page after the redirect declares says nothing new.
    for (const p of site.pages) if (!p.fetched.redirected) declared.set(norm(p.fetched.publicUrl), p.canonical ? absolute(p.canonical, p.fetched.publicUrl) : "");
    for (const [url, probe] of seoOf(site).canonicals) if (probe.canonical !== undefined && !probe.redirected) declared.set(url, probe.canonical);
    for (const p of site.pages) {
      const self = norm(p.fetched.publicUrl);
      const target = p.canonical ? absolute(p.canonical, p.fetched.publicUrl) : "";
      if (!target || norm(target) === self || !isSameSite(target, o)) continue;
      const next = declared.get(norm(target));
      if (next && norm(next) !== norm(target) && norm(next) !== self)
        add(p.fetched.publicUrl, t.canonicalChain(rel(target, site.base), rel(next, site.base)));
    }
    return out;
  },
};
