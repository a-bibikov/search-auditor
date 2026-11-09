/**
 * Security and HTTPS (SEC): is the site served securely, so browsers do not warn and search engines trust it.
 * HTTPS with a permanent redirect from http://, a valid certificate that is not about to expire, HSTS, the site's own
 * addresses on https://, no resources over http:// (mixed content), and basic security headers.
 * The connection checks need the live site: a local build has no certificate and no real server headers.
 */
import type { SeoRule } from "../util.ts";
import { sec1 } from "./sec-1.ts";
import { sec2 } from "./sec-2.ts";
import { sec3 } from "./sec-3.ts";
import { sec4 } from "./sec-4.ts";
import { sec5 } from "./sec-5.ts";
import { sec6 } from "./sec-6.ts";
import { sec7 } from "./sec-7.ts";

export const secRules: SeoRule[] = [sec1, sec2, sec3, sec4, sec5, sec6, sec7];
