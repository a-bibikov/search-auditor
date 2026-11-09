/** DATA-6: The home page names the site with WebSite. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";
import { typesOf } from "./shared.ts";

export const data6: SeoRule = {
  id: "DATA-6",
  group: "DATA",
  level: "info",
  run(site, _c, t) {
    const { out, add } = finder(this);
    // Google takes the site name shown above results from WebSite on the home page; without it, it guesses.
    const home = site.pages.find((p) => new URL(p.fetched.publicUrl).pathname === "/");
    if (home && !home.jsonLd.some((n) => typesOf(n).includes("WebSite") && typeof n.name === "string" && n.name.trim()))
      add(home.fetched.publicUrl, t.noWebSite);
    return out;
  },
};
