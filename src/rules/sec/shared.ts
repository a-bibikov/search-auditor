/** Constants and helpers shared by the SEC checks. */
import type { Page, Site } from "auditor-engine";

/** Half a year: the shortest HSTS max-age that browsers and the preload list treat as a real commitment. */
export const HSTS_MIN_AGE = 15_552_000;
/** A certificate that runs out within two weeks is about to take the site down. */
export const CERT_WARN_DAYS = 14;

/** The home page among the audited ones: its headers stand for the server's. */
export const homeOf = (site: Site): Page | undefined =>
  site.pages.find((p) => new URL(p.fetched.publicUrl).pathname === "/") ?? site.pages[0];

/** The site is live and on https: the checks of the connection itself apply. */
export const liveHttps = (site: Site, local: boolean) => !local && site.base.startsWith("https://");
