import type { Config as AiConfig, Fetched, Lang, Site } from "ai-search-auditor";

/** One extra request made for the SEO checks: what it answered and where it ended. */
export interface Probe {
  status: number;
  redirected: boolean;
  finalUrl: string;
  error?: string;
  /** The audited page where the URL was found (internal links). */
  from?: string;
}

/** Data the SEO checks need beyond the shared crawl, collected in the same run (collect.ts). */
export interface SeoExtras {
  /** The audit runs on a local build (--base points elsewhere): HTTPS checks do not apply. */
  local: boolean;
  /** A made-up address on the site: a real 404 must answer 404. */
  probe404: Fetched | null;
  /** The home page requested over plain http://, for live https sites only. */
  httpHome: Fetched | null;
  /** Canonical targets that were not among the sampled pages, by public URL. */
  canonicals: Map<string, Probe>;
  /** Internal links found on the audited pages, by public URL. */
  links: Map<string, Probe>;
  /** Unique internal links found, and how many were requested (capped by maxLinks). */
  linksFound: number;
  linksChecked: number;
}

/** A crawled site with the SEO extras attached. */
export type SeoSite = Site & { seo: SeoExtras };

export interface SearchConfig extends AiConfig {
  /** Internal links to request per run (default 100). */
  maxLinks: number;
  /** Run the AI search checks too (default true). */
  ai: boolean;
}

export type { Lang };
