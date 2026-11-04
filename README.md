# search-auditor

**Can Google, Bing and AI search find, read and cite your site?** One crawl, one report: classic SEO checks — status codes, canonical, sitemap, titles, headings, broken links, hreflang, HTTPS — and the AI search checks of [ai-search-auditor](https://github.com/a-bibikov/ai-search-audit), with a score for each and one overall.

```bash
npx search-auditor https://example.com
```

No sign-up, no API keys. Node.js 22.18+.

## Why both in one report

People find sites in two ways now: a list of links in Google, Bing or Yandex, and an answer from ChatGPT, Claude, Perplexity or Google AI Overviews that cites a few sources. Both start from the same thing — a crawler that can reach the page, read it and tell what it is about — and then they diverge. A broken canonical drops a page from Google; a heading that glues words together makes AI search misquote it.

Running two tools means two crawls, two reports and two scores that never meet. search-auditor crawls once, runs both rule sets on the same pages and puts the results side by side, so the first three things to fix are the three that cost the most, whichever kind of search they hurt.

## What it checks

24 classic search checks in ten groups, plus the 20 AI search checks of ai-search-auditor (turn them off with `--no-ai`). Nothing is checked twice: robots.txt for search crawlers, `noindex` and link cards are part of the AI search set.

**IDX. Indexing**
- **IDX-1** Audited pages answer 200
- **IDX-2** A page that does not exist answers 404, and no «not found» page answers 200

**SEC. HTTPS** (live sites only)
- **SEC-1** The site is on https, and http:// redirects to it
- **SEC-2** Pages do not load anything over http://

**CAN. Canonical**
- **CAN-1** Every page has a canonical
- **CAN-2** The canonical is an absolute address on this site
- **CAN-3** The canonical leads to a page that answers 200, not to an error or a redirect

**MAP. Sitemap**
- **MAP-1** There is a sitemap, and robots.txt points to it
- **MAP-2** Sitemap addresses do not redirect
- **MAP-3** Sitemap pages are their own canonical

**META. Titles and descriptions**
- **META-1** Every page has a title of about 10–60 characters
- **META-2** Every page has a description of about 50–160 characters
- **META-3** Titles and descriptions are not repeated across pages

**STR. Page structure**
- **STR-1** One H1 per page
- **STR-2** Heading levels do not skip
- **STR-3** The page declares its language
- **STR-4** Pages are set up for mobile

**LNK. Links**
- **LNK-1** Internal links work
- **LNK-2** Internal links do not go through redirects

**IMG. Images**
- **IMG-1** Images have alt text

**DATA. Structured data**
- **DATA-1** JSON-LD has no syntax errors

**LANG. Language versions** (sites with hreflang)
- **LANG-1** hreflang codes are valid
- **LANG-2** Language versions point at each other
- **LANG-3** There is an x-default

Levels: `error` — search engines cannot index the page or index the wrong one; `warn` — lowers rankings or clicks; `info` — a recommendation.

The report opens with the overall score and one per part («Classic search», «AI search»), then what to do first — the three changes worth the most, in plain words and with how many pages they touch — then the findings with fixes, and ends with a checklist of every check by group: ✓ OK, ✖ error, ⚠ warning, ℹ note, – not checked. A check that cannot run on a site — hreflang on a site in one language, HTTPS on a local build — is marked «not checked» with the reason, never as passed.

**Score:** each part is scored like ai-search-auditor: 100 minus 15 for each check with an error and 5 for each check with a warning; a warning that covers at least half of the audited pages costs 10. The overall score is the mean of the parts. A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 60, F below; if fewer than two thirds of the checks could run, the grade is capped at B.

## Usage

```bash
# A live site
npx search-auditor https://example.com

# A local build: requests go to localhost, the report shows public URLs
npx search-auditor http://127.0.0.1:3000 --base https://example.com

# Every page in the sitemap instead of a sample of 20
npx search-auditor https://example.com --pages all

# Classic search only, report in Russian
npx search-auditor https://example.com --no-ai --lang ru

# JSON for scripts and agents
npx search-auditor https://example.com --json --out report.json
```

| Option | |
|---|---|
| `--base <url>` | Public origin when auditing a local build |
| `--pages <n\|all>` | Pages to audit: a number sampled across templates (default 20), or `all` for every page in the sitemap |
| `--max-links <n>` | Internal links to request (default 100) |
| `--no-ai` | Classic search checks only |
| `--fail-on <level>` | Exit 1 on `error` (default), `warn` or `never` |
| `--lang <lang>` | Report language: `en` (default), `ru` |
| `--json` | JSON instead of Markdown |
| `--out <file>` | Also write the report to a file |
| `--config <file>` | Config file (default `search-auditor.config.json`) |
| `-v`, `--verbose` | Show progress |

Config — the options of ai-search-auditor plus two of its own:

```json
{
  "disable": ["STR-2", "C-7"],
  "maxPages": 20,
  "maxLinks": 100,
  "ai": true,
  "trainingBots": "any",
  "lang": "en"
}
```

`maxPages`: a number or `"all"`. With `"all"` every page in the sitemap is audited, so raise `maxLinks` too if you want every internal link checked.

In CI the Markdown report also goes to the job summary (`GITHUB_STEP_SUMMARY`).

## As a library

```js
import { auditSearch, toMarkdown } from "search-auditor";

const report = await auditSearch("https://example.com", { config: { lang: "en", ai: true } });
console.log(report.score, report.sections);
console.log(toMarkdown(report));
```

`ai-search-auditor` is a peer dependency: the crawl, the scoring and the report come from it, so both parts always run on the same engine version. The SEO checks are also exported as `seoPlugin` — rules, texts, groups and the extra requests they need — for runners that bring their own crawl.

## Roadmap

- **IDX-3** `noindex` and canonical do not contradict each other
- **IDX-4** robots.txt does not block CSS and JavaScript the page needs to render
- **CAN-4** Canonical chains: a canonical target whose own canonical points further
- **MAP-4** Every audited page is in the sitemap; the sitemap has no pages blocked by robots.txt
- **LNK-3** Orphan pages: in the sitemap, but no internal link leads to them
- **LNK-4** Redirect chains of more than one hop
- **IMG-2** Images are sized and lazy-loaded, so they do not slow the page down
- **PERF-1** Server response time and page weight
- **SOC-1** Twitter / X cards in addition to Open Graph

## License

MIT
