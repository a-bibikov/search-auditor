/** IDX-3: robots.txt answers without errors. */
import { finder } from "auditor-engine";
import { seoOf } from "../../collect.ts";
import { short, statusOf, type SeoRule } from "../util.ts";
import { ROBOTS_KEYS, ROBOTS_LIMIT } from "./shared.ts";

export const idx3: SeoRule = {
  id: "IDX-3",
  group: "IDX",
  level: "error",
  run(site, _c, t) {
    const { out, add } = finder(this);
    const r = seoOf(site).robotsRaw;
    const where = `${site.base}/robots.txt`;
    // 5xx, 429 and no answer: Google stops crawling. Other 4xx mean «no rules», which is fine.
    if (r.status === 0 || r.status === 429 || r.status >= 500) {
      add(where, t.robotsStatus(statusOf(r)));
      return out;
    }
    if (r.status !== 200) return out;
    if (/^\s*<(!doctype|html)/i.test(r.body)) {
      add(where, t.robotsHtml, "warn");
      return out;
    }
    if (Buffer.byteLength(r.body) > ROBOTS_LIMIT) add(where, t.robotsSize(Math.round(Buffer.byteLength(r.body) / 1024)), "warn");
    const bad = r.body
      .split(/\r?\n/)
      .map((l) => l.replace(/#.*/, "").trim())
      .filter((l) => l && !ROBOTS_KEYS.has((l.match(/^([a-z-]+)\s*:/i)?.[1] ?? "").toLowerCase()));
    if (bad.length) add(where, t.robotsBadLines(bad.length, short(bad[0]!, 50)), "warn");
    return out;
  },
};
