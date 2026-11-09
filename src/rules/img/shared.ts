/** Constants and helpers shared by the IMG checks. */
import { decode, textContent } from "auditor-engine";

/** One <img> of the raw HTML, with the attributes the checks need. */
export interface Img {
  src: string;
  alt: string | null;
  width: string | null;
  height: string | null;
  loading: string;
  /** Inside a <picture> that offers WebP or AVIF. */
  modernSource: boolean;
  /** Characters of text before the image: a rough stand-in for «is it on the first screen». */
  textBefore: number;
}

const attr = (tag: string, name: string) => {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? (m[1] ?? m[2] ?? m[3] ?? "") : null;
};

/** Every <img> in document order, and whether a <picture> around it offers a modern format. */
export function imgs(html: string): Img[] {
  const pictures = [...html.matchAll(/<picture\b[\s\S]*?<\/picture>/gi)].map((m) => ({
    start: m.index!,
    end: m.index! + m[0].length,
    modern: /<source\b[^>]*type\s*=\s*["']?image\/(webp|avif)/i.test(m[0]),
  }));
  return [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => {
    const tag = m[0];
    return {
      src: decode(attr(tag, "src") ?? attr(tag, "data-src") ?? ""),
      alt: attr(tag, "alt") === null ? null : decode(attr(tag, "alt")!),
      width: attr(tag, "width"),
      height: attr(tag, "height"),
      loading: (attr(tag, "loading") ?? "").toLowerCase(),
      modernSource: pictures.some((p) => p.modern && m.index! > p.start && m.index! < p.end),
      textBefore: textContent(html.slice(0, m.index!).replace(/<(script|style|head)\b[\s\S]*?<\/\1>/gi, "")).replace(/\s+/g, " ").trim().length,
    };
  });
}

/** An image heavier than this slows the page more than it needs to. */
export const MAX_IMAGE_BYTES = 500 * 1024;
/** More text than this before an image and it is below the first screen, where lazy loading is right. */
export const FIRST_SCREEN_TEXT = 1000;
/** From this many images on a page, the ones below the first screen should load lazily. */
export const LAZY_FROM = 5;
/** Alt text longer than this is a paragraph, not a description: screen readers read it in full. */
export const MAX_ALT = 150;

/** URLs that already serve WebP or AVIF to browsers that take it: image CDNs and framework image endpoints. */
export const NEGOTIATED = /\/_next\/image|\/_vercel\/image|\/cdn-cgi\/image\/|[?&](fm|format|f)=(webp|avif|auto)|[,/]f_auto|\/image\/upload\//i;
/** Alt text that names a file or a kind of thing, not what the image shows. */
export const POOR_ALT = /^(img|image|dsc|dscn|photo|pic|picture|screenshot|screen shot|снимок|фото|изображение|картинка|рисунок)?[\s_-]*\d*(\.(jpe?g|png|webp|gif|svg|avif))?$/i;
