import type { Config as EngineConfig, Fetched, Lang, Site } from "auditor-engine";

/** One extra request made for the SEO checks: what it answered and where it ended. */
export interface Probe {
  status: number;
  redirected: boolean;
  finalUrl: string;
  error?: string;
  /** The audited pages that link to the URL (internal links), in crawl order. */
  from?: string[];
  /** The canonical the page declares, absolute; for canonical targets that answered 200. */
  canonical?: string;
  /** An HTML page, as its Content-Type says: feeds, PDFs and other files are not pages to list. */
  html?: boolean;
  /** The page is closed with noindex (meta robots or X-Robots-Tag). */
  noindex?: boolean;
  /** Size from Content-Length, in bytes, when the server sends it. */
  bytes?: number;
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
  /** robots.txt as the server answered it, whatever the status: the crawl keeps it only on 200. */
  robotsRaw: Fetched;
  /** The home page on the other host, www. added or removed; live sites only, null when there is no such host. */
  otherHost: Fetched | null;
  /** A sampled page requested with the trailing slash toggled, and the canonical it declares. */
  slashVariant: { main: string; mainCanonical: string; variant: string; fetched: Fetched; canonical: string } | null;
  /** Addresses that redirect, followed hop by hop. */
  chains: Chain[];
  /** Time to the first byte of the home page, in ms, over a few requests; null on a local build. */
  ttfb: number[] | null;
  /** First answer of http://host/ without following it: the redirect code and where it points. Live https sites only. */
  httpHop: { status: number; location: string } | null;
  /** The TLS certificate of the live site; null on a local build or when the site is not on https. */
  cert: Certificate | null;
  /** A sampled page requested with UTM parameters, and the canonical it then declares. */
  utm: { page: string; url: string; status: number; canonical: string } | null;
  /** The sitemap files as served: those robots.txt declares (or /sitemap.xml), and the children of an index. */
  sitemapFiles: SitemapFile[];
  /** Sitemap addresses outside the sample, requested to see that they answer 200 (capped). */
  sitemapExtra: Map<string, Probe>;
  /** /favicon.ico, requested only when the home page declares no icon. */
  favicon: Fetched | null;
  /** Links to other sites found on the audited pages, requested to see that they still exist (capped). */
  external: Map<string, Probe>;
  /** Images of this site used on the audited pages: do they open, and how heavy are they (capped). */
  images: Map<string, Probe>;
}

/** One sitemap file: what it answered, what it is, and what is wrong with its format. */
export interface SitemapFile {
  url: string;
  /** Where it came from: robots.txt, the default /sitemap.xml, or a sitemap index. */
  source: "robots" | "default" | "index";
  status: number;
  error?: string;
  kind: "urlset" | "index" | "html" | "other" | "gzip";
  bytes: number;
  /** <url> or <sitemap> entries. */
  count: number;
  /** <loc> values with a bare & that breaks the XML. */
  badAmpersands: number;
}

/** What the TLS handshake said about the certificate. */
export interface Certificate {
  /** The certificate is trusted and matches the host. */
  valid: boolean;
  /** Why it is not trusted: expired, self-signed, wrong host… */
  error?: string;
  /** Days until it expires; negative when it already has. */
  daysLeft: number;
  validTo: string;
}

/** A redirect followed one hop at a time: every address on the way, and whether it came back to one of them. */
export interface Chain {
  url: string;
  hops: string[];
  loop: boolean;
  /** Status at the end of the chain (0 when it did not end). */
  status: number;
  /** The audited pages where the address was found: links, sitemap, canonical. */
  from: string[];
}

/** A crawled site with the SEO extras attached. */
export type SeoSite = Site & { seo: SeoExtras };

export interface SearchConfig extends EngineConfig {
  /** Internal links to request per run (default 100). */
  maxLinks: number;
}

export type { Lang };
