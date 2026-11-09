import { crawl, defaultConfig as engineDefaults, runRules, scoreOf, type CrawlOptions, type Lang, type Report, type Site } from "auditor-engine";
import { collect } from "./collect.ts";
import { seoMessages } from "./i18n/index.ts";
import { SEO_GROUPS, seoRules } from "./rules/index.ts";
import type { SearchConfig } from "./types.ts";

export type { Probe, SearchConfig, SeoExtras, SeoSite } from "./types.ts";
export type { SeoMessages, SeoRuleId } from "./i18n/index.ts";
export type { SeoRule } from "./rules/index.ts";
export { SEO_LANGS, seoMessages } from "./i18n/index.ts";
export { SEO_GROUPS, seoRules } from "./rules/index.ts";
export { collect, seoOf, type CollectOptions } from "./collect.ts";
export { toMarkdown, type Report } from "auditor-engine";

export const TOOL = { name: "search-auditor", url: "https://github.com/a-bibikov/search-auditor" };

export const defaultConfig: SearchConfig = { ...engineDefaults, maxLinks: 100 };

/** SEO group ids and names in checklist order. */
export const seoGroups = (lang: Lang): Record<string, string> => {
  const g = seoMessages(lang).groups;
  return Object.fromEntries(SEO_GROUPS.map((id) => [id, g[id]]));
};

export interface AuditSearchOptions {
  base?: string;
  config?: Partial<SearchConfig>;
  /** Explicit page list instead of the sitemap. */
  urls?: string[];
  log?: CrawlOptions["log"];
}

/** Crawls the site, collects what the classic search checks need besides the pages and runs them. */
export async function auditSearch(target: string, opts: AuditSearchOptions = {}): Promise<Report> {
  const config: SearchConfig = { ...defaultConfig, ...opts.config };
  const t = seoMessages(config.lang);
  const site: Site = await crawl(target, opts.base, { maxPages: config.maxPages, urls: opts.urls, log: opts.log });
  await collect(site, { maxLinks: config.maxLinks, log: opts.log });

  // Findings about sitemap entries or linked pages beyond the sample do not count as a share of the audited pages.
  const audited = site.pages.map((p) => p.fetched.publicUrl);
  const run = runRules(site, seoRules, config, t.m, t.rules);
  return {
    site: site.base,
    lang: config.lang,
    checkedAt: new Date().toISOString(),
    pages: audited,
    ...scoreOf(run.findings, { pages: site.pages.length, audited, checked: run.checked, total: run.total }),
    findings: run.findings,
    rules: run.rules,
    groups: seoGroups(config.lang),
    chrome: { title: t.report.title, clean: t.report.clean, footer: t.report.footer },
    tool: TOOL,
  };
}
