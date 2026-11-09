import type { Fetched, Rule } from "auditor-engine";
import type { SeoMessages } from "../i18n/index.ts";
import type { SearchConfig } from "../types.ts";

/** An SEO check: same contract as the AI search rules, with its own messages and config. */
export type SeoRule = Rule<SeoMessages["m"], SearchConfig>;

/** Trims and shortens text for a message; the message adds its own quotes. */
export const short = (s: string, max = 70) => {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max) + "…" : t;
};

/** «404», or the network error when there was no answer. */
export const statusOf = (f: Pick<Fetched, "status" | "error">) => (f.status ? String(f.status) : (f.error ?? "no answer"));

/** Absolute URL of a possibly relative href, or "" when it does not parse. */
export const absolute = (href: string, base: string) => {
  try {
    return new URL(href, base).href;
  } catch {
    return "";
  }
};

/** Same page with or without a trailing slash. */
export const norm = (u: string) => u.replace(/\/$/, "");

/** A URL on the audited site as a path («/blog/post»), like the report shows `where`; other URLs stay whole. */
export const rel = (url: string, base: string) => (url === base || url.startsWith(base + "/") ? url.slice(base.length) || "/" : url);
