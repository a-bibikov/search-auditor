/** DATA-5: Addresses and dates in the markup are in a format search engines read. */
import { finder, type JsonLdNode } from "auditor-engine";
import { short, type SeoRule } from "../util.ts";
import { DATE_KEYS, ISO_DATE, URL_KEYS } from "./shared.ts";

/** String values of a property: a plain string or each string of an array. */
const strings = (n: JsonLdNode, key: string) => {
  const v = n[key];
  return (Array.isArray(v) ? v : [v]).filter((x): x is string => typeof x === "string");
};

export const data5: SeoRule = {
  id: "DATA-5",
  group: "DATA",
  level: "warn",
  applies: (site, t) => (site.pages.some((p) => p.jsonLd.length) ? null : t.skipNoJsonLd),
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      // Relative addresses are resolved against nothing in JSON-LD: «/logo.png» is not an address there.
      const relative = p.jsonLd.flatMap((n) => URL_KEYS.flatMap((k) => strings(n, k).map((v) => `${k}: ${v}`))).filter((s) => !/: (https?:\/\/|#)/i.test(s));
      const dates = p.jsonLd.flatMap((n) => DATE_KEYS.flatMap((k) => strings(n, k).map((v) => ({ k, v })))).filter(({ v }) => !ISO_DATE.test(v.trim()));
      if (relative.length) add(p.fetched.publicUrl, t.relativeInMarkup(relative.length, short(relative[0]!, 60)));
      if (dates.length) add(p.fetched.publicUrl, t.badDatesInMarkup(dates.length, `${dates[0]!.k}: ${short(dates[0]!.v, 30)}`));
    }
    return out;
  },
};
