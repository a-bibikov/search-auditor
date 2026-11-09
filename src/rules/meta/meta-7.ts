/** META-7: The page declares its encoding. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";

export const meta7: SeoRule = {
  id: "META-7",
  group: "META",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      const header = /charset\s*=/i.test(p.fetched.headers.get("content-type") ?? "");
      // Browsers look for <meta charset> in the first 1024 bytes only.
      const meta = /<meta\b[^>]*charset\s*=/i.test(p.fetched.body.slice(0, 1024));
      if (!header && !meta) add(p.fetched.publicUrl, t.noCharset);
    }
    return out;
  },
};
