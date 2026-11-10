#!/usr/bin/env node
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { DEFAULT_LANG, LANGS, badgeMarkdown, isLang, parsePages, toBadge, toBadgeEndpoint, toJSON, toMarkdown } from "auditor-engine";
import { auditSearch, type Report, type SearchConfig } from "./index.ts";

const HELP = `search-auditor — technical SEO audit: can Google, Bing and Yandex reach, index and show your site?

AI search (ChatGPT, Claude, Perplexity) is checked by ai-search-auditor: npx ai-search-auditor <url>

Usage:
  search-auditor <url> [options]

Options:
  --base <url>        public origin when auditing a local build (links in sitemap point there)
  --pages <n|all>     pages to audit: a number sampled across templates (default 20), or all pages in the sitemap
  --max-links <n>     internal links to request (default 100)
  --fail-on <level>   exit 1 on: error (default), warn, never
  --lang <lang>       report language: ${Object.keys(LANGS).join(", ")} (default ${DEFAULT_LANG})
  --width <n>         fit tables into n characters (default: the terminal width; 0 — no wrapping)
  --json              print the JSON report instead of Markdown
  --out <file>        also write the report to a file (.json or .md)
  --badge <file>      also write a score badge: .svg to show in a README, .json for a shields.io endpoint
  --config <file>     config file (default: search-auditor.config.json if present)
  -v, --verbose       show progress
  -h, --help

Examples:
  npx search-auditor https://example.com
  npx search-auditor http://127.0.0.1:3000 --base https://example.com --fail-on warn
  npx search-auditor https://example.com --lang ru
  npx search-auditor https://example.com --pages all
`;

// An unknown or malformed flag gets one line with the help hint, not a stack trace.
let parsed;
try {
  parsed = parseArgs({
  // --no-ai turned the AI search checks off; they are no longer here, so old scripts keep working without it.
  args: process.argv.slice(2).filter((a) => a !== "--no-ai"),
  allowPositionals: true,
  options: {
    base: { type: "string" },
    pages: { type: "string" },
    "max-links": { type: "string" },
    "fail-on": { type: "string", default: "error" },
    lang: { type: "string" },
    json: { type: "boolean", default: false },
    width: { type: "string" },
    out: { type: "string" },
    badge: { type: "string" },
    config: { type: "string" },
    verbose: { type: "boolean", short: "v", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});
} catch (e) {
  process.stderr.write(`search-auditor: ${(e as Error).message.split(". To specify")[0]}\nRun with --help to see the options.\n`);
  process.exit(2);
}
const { values, positionals } = parsed;

const target = positionals[0];
if (values.help || !target) {
  process.stdout.write(HELP);
  process.exit(values.help ? 0 : 2);
}

// A function declaration, not an arrow: TypeScript treats only declared `never` functions as the end of a branch.
function fail(message: string): never {
  process.stderr.write(`search-auditor: ${message}\n`);
  process.exit(2);
}

const count = (name: string, v: string | undefined) => {
  if (v === undefined) return undefined;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) fail(`--${name} must be a whole number above 0, got «${v}»`);
  return n;
};

const url = /^https?:\/\//.test(target) ? target : `https://${target}`;
const configPath = values.config ?? (existsSync("search-auditor.config.json") ? "search-auditor.config.json" : undefined);
const fileConfig: Partial<SearchConfig> = configPath ? JSON.parse(readFileSync(configPath, "utf8")) : {};
// Flags win over the config file; an unknown language stops before any request is made.
const lang = values.lang ?? fileConfig.lang ?? DEFAULT_LANG;
if (!isLang(lang)) fail(`unknown language «${lang}», use one of: ${Object.keys(LANGS).join(", ")}`);
if (!["error", "warn", "never"].includes(values["fail-on"])) fail(`--fail-on must be error, warn or never, got «${values["fail-on"]}»`);
const pagesRaw = values.pages ?? fileConfig.maxPages;
const maxPages = pagesRaw === undefined ? undefined : parsePages(pagesRaw);
if (maxPages === null) fail(`${values.pages !== undefined ? "--pages" : "maxPages in the config"} must be a whole number above 0 or «all», got «${pagesRaw}»`);
const maxLinks = count("max-links", values["max-links"]);
const config: Partial<SearchConfig> = {
  ...fileConfig,
  lang,
  ...(maxPages ? { maxPages } : {}),
  ...(maxLinks ? { maxLinks } : {}),
};

// Progress goes to stderr, so `--json > report.json` stays clean.
const log = values.verbose ? (line: string) => process.stderr.write(`· ${line}\n`) : undefined;
let report: Report;
try {
  report = await auditSearch(url, { base: values.base, config, log });
} catch (e) {
  fail((e as Error).message);
}
const markdown = toMarkdown(report);
// In a terminal, tables fit the window and long cells wrap; a file and a CI summary keep plain Markdown.
if (values.width !== undefined && !/^\d+$/.test(values.width)) fail(`--width must be a whole number, got «${values.width}»`);
const columns = values.width !== undefined ? Number(values.width) : process.stdout.isTTY ? process.stdout.columns : 0;
const screen = columns > 0 ? toMarkdown(report, { width: columns }) : markdown;

const json = JSON.stringify(toJSON(report), null, 2) + "\n";
process.stdout.write(values.json ? json : screen);
if (values.out) writeFileSync(values.out, values.out.endsWith(".json") ? json : markdown);
if (values.badge) {
  const badge = { label: "SEO" };
  writeFileSync(values.badge, values.badge.endsWith(".json") ? JSON.stringify(toBadgeEndpoint(report, badge)) + "\n" : toBadge(report, badge));
  // The README line goes to stderr, so `--json > report.json` stays clean.
  const image = values.badge.endsWith(".json") ? `https://img.shields.io/endpoint?url=<public URL of ${values.badge}>` : values.badge;
  process.stderr.write(`· badge: ${values.badge}\n  ${badgeMarkdown(report, { ...badge, image, link: report.tool?.url ?? "" })}\n`);
}
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);

const failOn = values["fail-on"];
const failed = failOn === "never" ? false : failOn === "warn" ? report.counts.error + report.counts.warn > 0 : report.counts.error > 0;
process.exit(failed ? 1 : 0);
