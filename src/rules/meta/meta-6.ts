/** META-6: The description adds to the title, not repeats it. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";
import { plain } from "./shared.ts";

export const meta6: SeoRule = {
  id: "META-6",
  group: "META",
  level: "info",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      const [title, description] = [plain(p.title), plain(p.description)];
      // The same words, or the title with a few characters added: the snippet says nothing the title did not.
      if (title && description && (description === title || (description.startsWith(title) && description.length - title.length < 15)))
        add(p.fetched.publicUrl, t.descriptionRepeatsTitle);
    }
    return out;
  },
};
