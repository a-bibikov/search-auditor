/** LNK-5: Internal links do not carry nofollow. */
import { finder, isSameSite } from "auditor-engine";
import { absolute, rel, type SeoRule } from "../util.ts";
import { anchors } from "./shared.ts";

export const lnk5: SeoRule = {
  id: "LNK-5",
  group: "LNK",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    const o = { target: site.target, base: site.base };
    for (const p of site.pages) {
      const own = anchors(p.fetched.body)
        .filter((a) => a.href && /\bnofollow\b/i.test(a.rel))
        .map((a) => absolute(a.href!, p.fetched.publicUrl))
        .filter((u) => u && isSameSite(u, o));
      if (own.length) add(p.fetched.publicUrl, t.nofollowInternal(own.length, rel(own[0]!, site.base)));
    }
    return out;
  },
};
