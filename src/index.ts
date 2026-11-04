import {
  crawl,
  defaultConfig as aiDefaults,
  messages as aiMessages,
  rules as aiRules,
  runRules,
  scoreOf,
  type CrawlOptions,
  type Lang,
  type Report,
  type ReportSection,
  type Site,
} from "ai-search-auditor";
import { collect } from "./collect.ts";
import { seoMessages, type SeoMessages } from "./i18n/index.ts";
import { SEO_GROUPS, seoRules } from "./rules/index.ts";
import type { SearchConfig } from "./types.ts";

export type { Probe, SearchConfig, SeoExtras, SeoSite } from "./types.ts";
export type { SeoMessages, SeoRuleId } from "./i18n/index.ts";
export type { SeoRule } from "./rules/index.ts";
export { SEO_LANGS, seoMessages } from "./i18n/index.ts";
export { SEO_GROUPS, seoRules } from "./rules/index.ts";
export { collect, seoOf, type CollectOptions } from "./collect.ts";
export { toMarkdown, type Report } from "ai-search-auditor";

export const TOOL = { name: "search-auditor", url: "https://github.com/a-bibikov/search-auditor" };

export const defaultConfig: SearchConfig = { ...aiDefaults, maxLinks: 100, ai: true };

/** SEO group ids and names in checklist order. */
export const seoGroups = (lang: Lang): Record<string, string> => {
  const g = seoMessages(lang).groups;
  return Object.fromEntries(SEO_GROUPS.map((id) => [id, g[id]]));
};

/**
 * The SEO checks as a plugin for another runner (ai-search-auditor --seo): everything it needs to run them on its own
 * crawl and render them in its report.
 */
export const seoPlugin = {
  name: TOOL.name,
  rules: seoRules,
  groups: seoGroups,
  texts: (lang: Lang) => seoMessages(lang).rules,
  messages: (lang: Lang): SeoMessages["m"] => seoMessages(lang).m,
  section: (lang: Lang) => seoMessages(lang).report.classic,
  collect,
  defaults: { maxLinks: defaultConfig.maxLinks },
};

/** Same grade scale as ai-search-auditor: an A needs at least two thirds of the checks to have run. */
function gradeOf(score: number, coverage: number): { grade: Report["grade"]; capped: boolean } {
  const grade: Report["grade"] = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";
  return grade === "A" && coverage < 2 / 3 ? { grade: "B", capped: true } : { grade, capped: false };
}

export interface AuditSearchOptions {
  base?: string;
  config?: Partial<SearchConfig>;
  /** Explicit page list instead of the sitemap. */
  urls?: string[];
  log?: CrawlOptions["log"];
}

/**
 * One crawl, two rule sets: classic search (this package) and AI search (ai-search-auditor). The report has an overall
 * score and one per part, and renders with ai-search-auditor's toMarkdown.
 */
export async function auditSearch(target: string, opts: AuditSearchOptions = {}): Promise<Report> {
  const config: SearchConfig = { ...defaultConfig, ...opts.config };
  const st = seoMessages(config.lang);
  const at = aiMessages(config.lang);
  const site: Site = await crawl(target, opts.base, { maxPages: config.maxPages, urls: opts.urls, log: opts.log });
  await collect(site, { maxLinks: config.maxLinks, log: opts.log });

  const pages = site.pages.length;
  const seo = runRules(site, seoRules, config, st.m, st.rules);
  const ai = config.ai ? runRules(site, aiRules, config, at.m, at.rules) : null;
  const parts = [{ name: st.report.classic, run: seo }, ...(ai ? [{ name: st.report.ai, run: ai }] : [])];

  const sections: ReportSection[] = parts.map(({ name, run }) => {
    const s = scoreOf(run.findings, { pages, checked: run.checked, total: run.total });
    return { name, score: s.score, grade: s.grade, checked: s.checked, total: s.total };
  });
  const findings = parts.flatMap((p) => p.run.findings);
  const checked = parts.reduce((n, p) => n + p.run.checked, 0);
  const total = parts.reduce((n, p) => n + p.run.total, 0);

  // The overall score is the mean of the parts, so two parts at 80 make 80, not the sum of both parts' penalties.
  const overall = scoreOf(findings, { pages, checked, total });
  const score = Math.round(sections.reduce((n, s) => n + s.score, 0) / sections.length);
  const grade = gradeOf(score, total ? checked / total : 1);

  return {
    site: site.base,
    lang: config.lang,
    checkedAt: new Date().toISOString(),
    pages: site.pages.map((p) => p.fetched.publicUrl),
    ...overall,
    score,
    grade: grade.grade,
    capped: grade.capped,
    findings,
    rules: parts.flatMap((p) => p.run.rules),
    groups: { ...seoGroups(config.lang), ...(ai ? at.report.groups : {}) },
    ...(ai ? { sections } : {}),
    chrome: { title: st.report.title, clean: st.report.clean, footer: st.report.footer },
    tool: TOOL,
  };
}
