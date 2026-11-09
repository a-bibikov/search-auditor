/** LNK-4: Links can be followed by a crawler. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";
import { anchors } from "./shared.ts";

export const lnk4: SeoRule = {
  id: "LNK-4",
  group: "LNK",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      // No href, a bare «#» or javascript: — a crawler has nowhere to go. An <a name> or <a id> target is fine.
      const dead = anchors(p.fetched.body).filter((a) =>
        a.href === null ? !a.named : a.href.trim() === "#" || /^\s*javascript:/i.test(a.href),
      );
      if (dead.length) add(p.fetched.publicUrl, t.uncrawlableLinks(dead.length, dead[0]!.text || dead[0]!.label || "…"));
    }
    return out;
  },
};
