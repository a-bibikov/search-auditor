import { finder } from "ai-search-auditor";
import { rel, short, type SeoRule } from "./util.ts";

const TITLE = { min: 10, max: 60 };
const DESCRIPTION = { min: 50, max: 160 };
/** Characters as a person counts them: emoji and letters with marks are one each. */
const len = (s: string) => [...s.trim()].length;

const meta1: SeoRule = {
  id: "META-1",
  group: "META",
  level: "error",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      const n = len(p.title);
      if (!n) add(p.fetched.publicUrl, t.noTitle);
      else if (n < TITLE.min || n > TITLE.max) add(p.fetched.publicUrl, t.titleLength(n, short(p.title)), "warn");
    }
    return out;
  },
};

const meta2: SeoRule = {
  id: "META-2",
  group: "META",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      const n = len(p.description);
      if (!n) add(p.fetched.publicUrl, t.noDescription);
      else if (n < DESCRIPTION.min || n > DESCRIPTION.max) add(p.fetched.publicUrl, t.descriptionLength(n), "info");
    }
    return out;
  },
};

const meta3: SeoRule = {
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

const str1: SeoRule = {
  id: "STR-1",
  group: "STR",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      if (!p.h1.length) add(p.fetched.publicUrl, t.noH1);
      else if (p.h1.length > 1) add(p.fetched.publicUrl, t.manyH1(p.h1.length));
    }
    return out;
  },
};

const str2: SeoRule = {
  id: "STR-2",
  group: "STR",
  level: "info",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      // One finding per page: the first skip is enough to show the pattern.
      const hs = p.headingsAll;
      const i = hs.findIndex((h, k) => k > 0 && h.level > hs[k - 1]!.level + 1);
      if (i > 0) add(p.fetched.publicUrl, t.skippedLevel(hs[i - 1]!.level, hs[i]!.level, short(hs[i]!.text, 50)));
    }
    return out;
  },
};

const str3: SeoRule = {
  id: "STR-3",
  group: "STR",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) if (!p.htmlLang.trim()) add(p.fetched.publicUrl, t.noLang);
    return out;
  },
};

const str4: SeoRule = {
  id: "STR-4",
  group: "STR",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) if (!/width\s*=\s*device-width/i.test(p.viewport)) add(p.fetched.publicUrl, t.noViewport);
    return out;
  },
};

const img1: SeoRule = {
  id: "IMG-1",
  group: "IMG",
  level: "warn",
  applies: (site, t) => (site.pages.some((p) => p.images.length) ? null : t.skipNoImages),
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      const missing = p.images.filter((i) => i.alt === null);
      if (missing.length) add(p.fetched.publicUrl, t.imagesNoAlt(missing.length, p.images.length, rel(missing[0]!.src, site.base)));
    }
    return out;
  },
};

const data1: SeoRule = {
  id: "DATA-1",
  group: "DATA",
  level: "error",
  applies: (site, t) => (site.pages.some((p) => p.jsonLd.length || p.jsonLdErrors.length) ? null : t.skipNoJsonLd),
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) for (const e of p.jsonLdErrors) add(p.fetched.publicUrl, t.jsonLdError(short(e, 100)));
    return out;
  },
};

export const pageRules = [meta1, meta2, meta3, str1, str2, str3, str4, img1, data1];
