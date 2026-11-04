/**
 * English texts of the SEO checks: the reference for every other language. A new language is a file typed as
 * `SeoMessages` (TypeScript lists what is missing) plus a line in ./index.ts. AI search texts come from ai-search-auditor.
 */
export const en = {
  report: {
    title: (site: string) => `Search audit: ${site}`,
    clean: "Nothing to fix: search engines and AI search can read, understand and cite these pages.",
    footer: (pages: number, date: string) =>
      `Checked ${pages} pages on ${date}. Also check by hand after each deploy: Google Search Console, Bing Webmaster Tools (ChatGPT search relies on Bing), Yandex Webmaster, and the live CDN with real crawlers.`,
    classic: "Classic search",
    ai: "AI search",
  },

  groups: {
    IDX: "Indexing",
    CAN: "Canonical",
    MAP: "Sitemap",
    META: "Titles and descriptions",
    STR: "Page structure",
    LNK: "Links",
    IMG: "Images",
    DATA: "Structured data",
    LANG: "Language versions",
    SEC: "HTTPS",
  },

  rules: {
    "IDX-1": {
      title: "Pages answer 200",
      fix: "Fix the pages that answer an error or time out, or remove them from the sitemap and internal links. Search engines drop pages that keep failing.",
      impact: "Some pages answer an error, so search engines drop them from the results.",
    },
    "IDX-2": {
      title: "Missing pages answer 404",
      fix: "Answer 404 (or 410) for pages that do not exist, and do not show «not found» pages with 200. Otherwise search engines index empty pages and waste crawling on them.",
      impact: "Empty «not found» pages look like real ones, so search engines index junk and crawl the site less well.",
    },
    "CAN-1": {
      title: "Every page has a canonical",
      fix: 'Add `<link rel="canonical" href="https://example.com/page">` with the page\'s own address to every page, so duplicates (parameters, trailing slashes) point at one version.',
      impact: "Without a canonical, copies of a page with parameters compete with each other in search.",
    },
    "CAN-2": {
      title: "The canonical is an absolute address on this site",
      fix: "Use an absolute URL with https and the right host in the canonical. A relative or foreign canonical tells search engines to rank another page instead.",
      impact: "The canonical points to the wrong place, so search engines may rank another page or none.",
    },
    "CAN-3": {
      title: "The canonical leads to a page that works",
      fix: "Point the canonical at the final address that answers 200, not at a redirect or an error.",
      impact: "The canonical leads to a broken or redirecting page, so the page itself may disappear from search.",
    },
    "MAP-1": {
      title: "There is a sitemap, and robots.txt points to it",
      fix: "Serve /sitemap.xml with every page you want in search and add `Sitemap: https://example.com/sitemap.xml` to robots.txt.",
      impact: "Search engines find new and deep pages later without a sitemap.",
    },
    "MAP-2": {
      title: "Sitemap addresses do not redirect",
      fix: "List the final addresses in the sitemap: the ones that answer 200 without redirects.",
      impact: "The sitemap sends search engines through redirects, which slows down indexing.",
    },
    "MAP-3": {
      title: "Sitemap pages are their own canonical",
      fix: "List only canonical pages in the sitemap. A page whose canonical points elsewhere is a duplicate and should not be there.",
      impact: "The sitemap lists duplicates, so search engines get mixed signals about which page to show.",
    },
    "META-1": {
      title: "Every page has a title of the right length",
      fix: "Give every page a unique <title> of about 10–60 characters with the main query first. Longer titles are cut in the results.",
      impact: "Missing or cut titles make the result less clickable and less relevant.",
    },
    "META-2": {
      title: "Every page has a description",
      fix: 'Add `<meta name="description">` of about 50–160 characters: what the page offers and why to open it.',
      impact: "Without a description search engines pick a random snippet, and fewer people click.",
    },
    "META-3": {
      title: "Titles and descriptions are not repeated across pages",
      fix: "Write a distinct title and description for each page. Repeated ones make pages look like duplicates.",
      impact: "Pages with the same title compete with each other, and search engines show the wrong one.",
    },
    "STR-1": {
      title: "One H1 per page",
      fix: "Give each page exactly one H1 that says what the page is about; use H2–H6 for sections.",
      impact: "Without one clear H1, search engines read the topic of the page less reliably.",
    },
    "STR-2": {
      title: "Heading levels do not skip",
      fix: "Go down one level at a time: H1, then H2, then H3. Style headings with CSS, not by picking a level for its size.",
      impact: "A broken outline makes the structure of the page harder to read for search engines and screen readers.",
    },
    "STR-3": {
      title: "The page declares its language",
      fix: 'Set `<html lang="en">` (the page\'s real language) on every page.',
      impact: "Without a language, search engines and browsers may show the page to the wrong audience or offer to translate it.",
    },
    "STR-4": {
      title: "Pages are set up for mobile",
      fix: 'Add `<meta name="viewport" content="width=device-width, initial-scale=1">`. Google ranks by the mobile version of the page.',
      impact: "Without a mobile viewport the page renders as a shrunken desktop page, and mobile rankings suffer.",
    },
    "LNK-1": {
      title: "Internal links work",
      fix: "Fix or remove links that lead to errors. Broken links waste crawling and lose the link value they would pass.",
      impact: "Links lead to broken pages: visitors leave, and search engines crawl the site less.",
    },
    "LNK-2": {
      title: "Internal links do not go through redirects",
      fix: "Link straight to the final address (with the right trailing slash, host and https), not to one that redirects.",
      impact: "Every redirect in a link slows crawling and loses a little of the link's value.",
    },
    "IMG-1": {
      title: "Images have alt text",
      fix: 'Add an `alt` that says what the image shows; use `alt=""` for decorative images. Image search and screen readers depend on it.',
      impact: "Images without alt are invisible to image search and to people using screen readers.",
    },
    "DATA-1": {
      title: "Structured data has no syntax errors",
      fix: "Fix the JSON-LD blocks that do not parse: one error drops the whole block, and rich results with it.",
      impact: "Broken structured data is ignored, so the pages lose rich results in search.",
    },
    "LANG-1": {
      title: "hreflang codes are valid",
      fix: "Use language codes like `en`, `ru`, `en-GB` or `x-default`. An invalid code makes search engines ignore the whole set.",
      impact: "Invalid language codes are ignored, so people get the wrong language version in search.",
    },
    "LANG-2": {
      title: "Language versions point at each other",
      fix: "If page A lists page B as a translation, B must list A too. One-way hreflang links are ignored.",
      impact: "One-way language links are ignored, so search shows the wrong language version.",
    },
    "LANG-3": {
      title: "There is an x-default for other languages",
      fix: 'Add `<link rel="alternate" hreflang="x-default" href="…">` pointing at the version for everyone else.',
      impact: "Visitors whose language is not covered get a version chosen at random.",
    },
    "SEC-1": {
      title: "The site works over HTTPS, and http:// redirects to it",
      fix: "Serve the site over https and redirect every http:// address to its https:// version with a 301.",
      impact: "Without HTTPS browsers mark the site as not secure, and search engines prefer secure competitors.",
    },
    "SEC-2": {
      title: "HTTPS pages do not load anything over http://",
      fix: "Load images, scripts and styles over https. Browsers block or warn about mixed content.",
      impact: "Mixed content breaks parts of the page in browsers and makes the site look unsafe.",
    },
  },

  /** Finding messages. URLs and quotes come in already formatted. */
  m: {
    status: (status: string) => `answers ${status}`,
    soft404Probe: (url: string) => `a made-up address ${url} answers 200 instead of 404`,
    soft404Page: (title: string) => `answers 200 but looks like a «not found» page: «${title}»`,
    noCanonical: "no canonical",
    relativeCanonical: (href: string) => `relative canonical ${href}`,
    foreignCanonical: (href: string) => `canonical points to another site: ${href}`,
    canonicalStatus: (href: string, status: string) => `canonical ${href} answers ${status}`,
    canonicalRedirects: (href: string, to: string) => `canonical ${href} redirects to ${to}`,
    noSitemap: "no sitemap.xml",
    sitemapNotInRobots: "robots.txt does not point to the sitemap",
    sitemapRedirects: (to: string) => `listed in the sitemap, redirects to ${to}`,
    sitemapCanonicalElsewhere: (href: string) => `listed in the sitemap, but its canonical is ${href}`,
    noTitle: "no <title>",
    titleLength: (n: number, title: string) => `title of ${n} characters: «${title}»`,
    noDescription: "no meta description",
    descriptionLength: (n: number) => `description of ${n} characters`,
    sameTitle: (n: number, title: string) => `the same title on ${n} pages: «${title}»`,
    sameDescription: (n: number, text: string) => `the same description on ${n} pages: «${text}»`,
    noH1: "no H1",
    manyH1: (n: number) => `${n} H1 headings`,
    skippedLevel: (from: number, to: number, text: string) => `H${from} is followed by H${to}: «${text}»`,
    noLang: "no <html lang>",
    noViewport: "no viewport meta tag",
    brokenLink: (status: string, from: string) => `answers ${status}, linked from ${from}`,
    redirectLink: (to: string, from: string) => `redirects to ${to}, linked from ${from}`,
    linksNotChecked: (checked: number, found: number) => `${checked} of ${found} internal links checked; raise --max-links to check more`,
    imagesNoAlt: (n: number, total: number, example: string) => `${n} of ${total} images without alt, e.g. ${example}`,
    jsonLdError: (error: string) => `JSON-LD does not parse: ${error}`,
    badHreflang: (code: string) => `invalid hreflang code «${code}»`,
    oneWayHreflang: (lang: string, href: string) => `lists ${href} as «${lang}», but that page does not link back`,
    noXDefault: (langs: string) => `${langs} versions and no x-default`,
    notHttps: "the site is not served over https",
    httpNoRedirect: (to: string) => `http:// does not redirect to https:// (ends at ${to})`,
    mixedContent: (n: number, example: string) => `${n} ${n === 1 ? "resource" : "resources"} over http://, e.g. ${example}`,
    skipLocal: "local build: check the live site",
    skipNoSitemap: "no sitemap.xml",
    skipNoHreflang: "the site has no hreflang",
    skipOneLanguage: "the site has one language",
    skipNoImages: "no images on the audited pages",
    skipNoJsonLd: "no structured data on the audited pages",
    skipNoLinks: "no internal links on the audited pages",
    skipNotHttps: "the site is not on https",
  },
};

export type SeoMessages = typeof en;
export type SeoRuleId = keyof SeoMessages["rules"];
