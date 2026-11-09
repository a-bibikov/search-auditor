/** SEC-2: HTTPS pages do not load anything over http://. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";

export const sec2: SeoRule = {
  id: "SEC-2",
  group: "SEC",
  level: "warn",
  applies: (site, t) => (site.base.startsWith("https://") ? null : t.skipNotHttps),
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      const insecure = p.resources.filter((r) => r.startsWith("http://"));
      if (insecure.length) add(p.fetched.publicUrl, t.mixedContent(insecure.length, insecure[0]!));
    }
    return out;
  },
};
