/** META-8: The snippet is not forbidden. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";

export const meta8: SeoRule = {
  id: "META-8",
  group: "META",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      const rules = `${p.metaRobots} ${p.fetched.headers.get("x-robots-tag") ?? ""}`;
      const found = rules.match(/\bnosnippet\b|\bmax-snippet\s*:\s*0\b/i)?.[0];
      if (found) add(p.fetched.publicUrl, t.noSnippet(found));
    }
    return out;
  },
};
