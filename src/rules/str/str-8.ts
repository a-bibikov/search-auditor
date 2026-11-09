/** STR-8: <html lang> matches the language of the text. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";
import { CYRILLIC_LANGS, LATIN_LANGS, MIN_LETTERS, scriptOf } from "./shared.ts";

export const str8: SeoRule = {
  id: "STR-8",
  group: "STR",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      const lang = p.htmlLang.trim().toLowerCase().split(/[-_]/)[0] ?? "";
      const { cyrillic, letters } = scriptOf(p.text);
      if (!lang || letters < MIN_LETTERS) continue;
      // Only a clear mismatch: a Cyrillic page declared as a Latin-script language, or the other way round.
      const percent = Math.round(cyrillic * 100);
      if (LATIN_LANGS.has(lang) && cyrillic > 0.7) add(p.fetched.publicUrl, t.langMismatch(lang, t.scriptCyrillic, percent));
      if (CYRILLIC_LANGS.has(lang) && cyrillic < 0.3) add(p.fetched.publicUrl, t.langMismatch(lang, t.scriptLatin, 100 - percent));
    }
    return out;
  },
};
