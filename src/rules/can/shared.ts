/** Constants and helpers shared by the CAN checks. */
import type { Page } from "auditor-engine";

/** Every <link rel="canonical"> in the raw HTML, with its href and whether it sits in <head>. */
export function canonicalTags(html: string): { href: string; inHead: boolean }[] {
  // Where <head> ends: the closing tag, or the first <body> when the closing tag is left out.
  const end = html.search(/<\/head\s*>|<body[\s>]/i);
  const tags: { href: string; inHead: boolean }[] = [];
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    if (!/\brel\s*=\s*["']?[^"'>]*\bcanonical\b/i.test(tag)) continue;
    const href = tag.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    tags.push({ href: (href?.[1] ?? href?.[2] ?? href?.[3] ?? "").trim(), inHead: end < 0 || m.index! < end });
  }
  return tags;
}

/** The canonical from the HTTP Link header (`Link: <url>; rel="canonical"`), or "". */
export function headerCanonical(page: Page): string {
  const link = page.fetched.headers.get("link") ?? "";
  for (const part of link.split(/,(?=\s*<)/)) {
    const m = part.match(/<([^>]+)>\s*;(.*)/);
    if (m && /\brel\s*=\s*"?canonical"?/i.test(m[2]!)) return m[1]!.trim();
  }
  return "";
}

/** The language of a page without the region: «ru» for ru-RU. Empty when the page does not say. */
export const langOf = (p: Page) => p.htmlLang.trim().toLowerCase().split(/[-_]/)[0] ?? "";
