/** Constants and helpers shared by the IDX checks. */
import { type Page } from "auditor-engine";

/** Titles and H1s of «not found» pages that still answer 200. */
export const NOT_FOUND = /\b(404|not found|page not found|doesn.t exist)\b|не найден|страница не существует|ничего не найдено/i;

/** The search crawlers whose robots.txt groups matter for indexing. */
export const SEARCH_BOTS = ["Googlebot", "Bingbot", "Yandex"];

/** Directives search engines understand; anything else in robots.txt is skipped by them. */
export const ROBOTS_KEYS = new Set(["user-agent", "allow", "disallow", "sitemap", "crawl-delay", "host", "clean-param"]);

/** Google reads the first 500 KiB of robots.txt. */
export const ROBOTS_LIMIT = 500 * 1024;

/** web.dev: a time to first byte up to 0.8 s is good, over 1.8 s is poor. */
export const TTFB = { slow: 800, poor: 1800 };

export const pathOf = (url: string) => {
  const u = new URL(url);
  return u.pathname + u.search;
};

export const isNoindex = (p: Page) => /\b(noindex|none)\b/i.test(`${p.metaRobots} ${p.fetched.headers.get("x-robots-tag") ?? ""}`);

export const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
