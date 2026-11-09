/** MAP-4: The sitemap file is valid. */
import { finder } from "auditor-engine";
import { seoOf } from "../../collect.ts";
import { statusOf, type SeoRule } from "../util.ts";
import { MAX_BYTES, MAX_URLS } from "./shared.ts";

export const map4: SeoRule = {
  id: "MAP-4",
  group: "MAP",
  level: "error",
  run(site, _c, t) {
    const { out, add } = finder(this);
    for (const f of seoOf(site).sitemapFiles) {
      // No /sitemap.xml at the default address is MAP-1's finding; a declared or listed file that fails is this one.
      if (f.status !== 200) {
        if (f.source !== "default") add(f.url, t.sitemapStatus(statusOf(f)));
        continue;
      }
      if (f.kind === "gzip") continue;
      if (f.kind === "html") add(f.url, t.sitemapHtml);
      else if (f.kind === "other") add(f.url, t.sitemapNotXml);
      if (f.count > MAX_URLS) add(f.url, t.sitemapTooMany(f.count));
      if (f.bytes > MAX_BYTES) add(f.url, t.sitemapTooBig(Math.round(f.bytes / 1024 / 1024)));
      if (f.badAmpersands) add(f.url, t.sitemapAmpersand(f.badAmpersands));
    }
    return out;
  },
};
