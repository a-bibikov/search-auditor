/** LNK-6: Link text says where the link goes. */
import { finder } from "auditor-engine";
import { short, type SeoRule } from "../util.ts";
import { anchors, VAGUE } from "./shared.ts";

export const lnk6: SeoRule = {
  id: "LNK-6",
  group: "LNK",
  level: "info",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      const links = anchors(p.fetched.body).filter((a) => a.href && !a.href.startsWith("#"));
      // «Read more» and friends: the text a search engine uses to learn what the target page is about.
      const vague = links.filter((a) => !a.label && VAGUE.test(a.text.replace(/[\s→›»….:!>]+$/u, "")));
      // No text, no label, no alt: an icon or an image link that names nothing.
      const nameless = links.filter((a) => !a.text && !a.label && !a.alt);
      if (vague.length) add(p.fetched.publicUrl, t.vagueLinks(vague.length, short(vague[0]!.text, 30)));
      if (nameless.length) add(p.fetched.publicUrl, t.namelessLinks(nameless.length, nameless[0]!.href!));
    }
    return out;
  },
};
