/** META-3: Titles and descriptions are not repeated across pages. */
import { finder } from "auditor-engine";
import { short, type SeoRule } from "../util.ts";

export const meta3: SeoRule = {
  id: "META-3",
  group: "META",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    const repeated = (pick: (p: (typeof site.pages)[number]) => string, message: (n: number, text: string) => string) => {
      const by = new Map<string, string[]>();
      for (const p of site.pages) {
        const v = pick(p).trim();
        if (v) by.set(v, [...(by.get(v) ?? []), p.fetched.publicUrl]);
      }
      for (const [text, urls] of by) if (urls.length > 1) for (const u of urls) add(u, message(urls.length, short(text)));
    };
    repeated((p) => p.title, t.sameTitle);
    repeated((p) => p.description, t.sameDescription);
    return out;
  },
};
