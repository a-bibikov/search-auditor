/** DATA-2: Every block has @context and every entity a @type. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";
import { blocks, isReference, topNodes, typesOf } from "./shared.ts";

export const data2: SeoRule = {
  id: "DATA-2",
  group: "DATA",
  level: "warn",
  applies: (site, t) => (site.pages.some((p) => p.jsonLd.length) ? null : t.skipNoJsonLd),
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      for (const block of blocks(p.fetched.body)) {
        const tops = Array.isArray(block) ? block : [block];
        // @context may sit on the block or on each item of an array.
        const context = tops.every((b) => b && typeof b === "object" && /schema\.org/i.test(JSON.stringify((b as Record<string, unknown>)["@context"] ?? "")));
        if (!context) add(p.fetched.publicUrl, t.noContext);
        const untyped = topNodes(block).filter((n) => !isReference(n) && !typesOf(n).length);
        if (untyped.length) add(p.fetched.publicUrl, t.noType(untyped.length));
      }
    }
    return out;
  },
};
