/** DATA-3: Rich-result types have the properties Google requires. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";
import { REQUIRED, typesOf } from "./shared.ts";

/** Present and not empty: "", [] and {} do not count. */
const has = (n: Record<string, unknown>, key: string) => {
  const v = n[key];
  return v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && !v.length);
};

export const data3: SeoRule = {
  id: "DATA-3",
  group: "DATA",
  level: "warn",
  applies: (site, t) => (site.pages.some((p) => p.jsonLd.some((n) => typesOf(n).some((x) => REQUIRED[x]))) ? null : t.skipNoRichTypes),
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const p of site.pages) {
      const missing = new Map<string, Set<string>>();
      for (const n of p.jsonLd)
        for (const type of typesOf(n)) {
          const absent = (REQUIRED[type] ?? []).filter((req) => !req.split("|").some((k) => has(n, k)));
          if (absent.length) missing.set(type, new Set([...(missing.get(type) ?? []), ...absent.map((a) => a.replace(/\|/g, " / "))]));
        }
      for (const [type, keys] of missing) add(p.fetched.publicUrl, t.missingProperties(type, [...keys].join(", ")));
    }
    return out;
  },
};
