/** Constants and helpers shared by the LNK checks. */
import { textContent } from "auditor-engine";

/** One <a> of the raw HTML: its href as written, rel, the text a person and a crawler read, and its attributes. */
export interface Anchor {
  href: string | null;
  rel: string;
  text: string;
  /** aria-label or title: a name for links whose text is an icon. */
  label: string;
  /** The alt of images inside the link, which names an image link. */
  alt: string;
  named: boolean;
}

const attr = (tag: string, name: string) => {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? (m[1] ?? m[2] ?? m[3] ?? "") : null;
};

/** Every <a>…</a> in the HTML. A regex is enough here: links do not nest. */
export function anchors(html: string): Anchor[] {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((m) => {
    const open = `<a${m[1]}>`;
    const inner = m[2] ?? "";
    const alts = [...inner.matchAll(/<img\b[^>]*>/gi)].map((i) => attr(i[0], "alt") ?? "").join(" ");
    return {
      href: attr(open, "href"),
      rel: attr(open, "rel") ?? "",
      text: textContent(inner).replace(/\s+/g, " ").trim(),
      label: (attr(open, "aria-label") ?? attr(open, "title") ?? "").trim(),
      alt: alts.trim(),
      named: attr(open, "name") !== null || attr(open, "id") !== null,
    };
  });
}

/** Link texts that say nothing about where the link goes. */
export const VAGUE = /^(click here|here|read more|more|learn more|see more|link|this link|continue|go|details|здесь|тут|сюда|подробнее|читать далее|читать|далее|ещё|еще|ссылка|по ссылке|перейти|узнать больше|нажмите здесь|смотреть)$/i;

/**
 * Error codes that mean the domain is gone: no DNS record. Timeouts, refused connections and EAI_AGAIN («try again»)
 * say more about the network the audit runs in than about the site, so they never count as dead.
 */
export const GONE = /^(ENOTFOUND|ERR_NAME_NOT_RESOLVED)$/;
