/** IDX-2: Missing pages answer 404. */
import { finder } from "auditor-engine";
import { seoOf } from "../../collect.ts";
import { rel, short, type SeoRule } from "../util.ts";
import { NOT_FOUND } from "./shared.ts";

export const idx2: SeoRule = {
  id: "IDX-2",
  group: "IDX",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    const probe = seoOf(site).probe404;
    if (probe && probe.status === 200) add("site", t.soft404Probe(rel(probe.publicUrl, site.base)));
    for (const p of site.pages) {
      const head = p.h1[0] ?? "";
      if (NOT_FOUND.test(p.title) || NOT_FOUND.test(head)) add(p.fetched.publicUrl, t.soft404Page(short(p.title || head)));
    }
    return out;
  },
};
