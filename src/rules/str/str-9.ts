/** STR-9: The main content sits in <main>. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";

export const str9: SeoRule = {
  id: "STR-9",
  group: "STR",
  level: "info",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) if (!/<main\b|\brole\s*=\s*["']?main\b/i.test(p.fetched.body)) add(p.fetched.publicUrl, t.noMain);
    return out;
  },
};
