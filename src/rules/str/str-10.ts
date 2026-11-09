/** STR-10: The page starts with <!doctype html>. */
import { finder } from "auditor-engine";
import type { SeoRule } from "../util.ts";

export const str10: SeoRule = {
  id: "STR-10",
  group: "STR",
  level: "warn",
  run(site, _c, t) {
    const { out, add } = finder(this);
    // Comments and a byte order mark may come first; anything else puts the browser in quirks mode.
    for (const p of site.pages)
      if (!/^(﻿)?(\s|<!--[\s\S]*?-->)*<!doctype\s+html/i.test(p.fetched.body)) add(p.fetched.publicUrl, t.noDoctype);
    return out;
  },
};
