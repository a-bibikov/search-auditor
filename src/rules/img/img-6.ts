/** IMG-6: Images are not heavier than they need to be. */
import { finder } from "auditor-engine";
import { seoOf } from "../../collect.ts";
import { rel, type SeoRule } from "../util.ts";
import { MAX_IMAGE_BYTES } from "./shared.ts";

export const img6: SeoRule = {
  id: "IMG-6",
  group: "IMG",
  level: "warn",
  applies: (site, t) => (seoOf(site).images.size ? null : t.skipNoOwnImages),
  run(site, _c, t) {
    const { out, add } = finder(this);
    // By Content-Length: a server that does not send it is not guessed at.
    for (const [url, p] of seoOf(site).images)
      if (p.status === 200 && (p.bytes ?? 0) > MAX_IMAGE_BYTES)
        for (const page of p.from ?? []) add(page, t.heavyImage(rel(url, site.base), Math.round(p.bytes! / 1024), MAX_IMAGE_BYTES / 1024));
    return out;
  },
};
