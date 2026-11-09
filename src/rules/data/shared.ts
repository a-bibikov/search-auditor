/** Constants and helpers shared by the DATA checks. */
import { jsonLdTypes, type JsonLdNode } from "auditor-engine";

/** The JSON-LD blocks of the raw HTML that parse, as written: the top level keeps @context, flattening loses it. */
export function blocks(html: string): unknown[] {
  const out: unknown[] = [];
  for (const m of html.matchAll(/<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      out.push(JSON.parse(m[1] ?? ""));
    } catch {
      // A block that does not parse is DATA-1's finding.
    }
  }
  return out;
}

/** The entities a block describes at its top level: the block itself, the items of an array, or of @graph. */
export const topNodes = (block: unknown): JsonLdNode[] => {
  const list = Array.isArray(block) ? block : [block];
  return list.flatMap((b) => {
    if (!b || typeof b !== "object") return [];
    const graph = (b as JsonLdNode)["@graph"];
    return Array.isArray(graph) ? (graph as JsonLdNode[]) : [b as JsonLdNode];
  });
};

/** A node that only points at another one: {"@id": "…#person"}. It needs no @type of its own. */
export const isReference = (n: JsonLdNode) => Object.keys(n).every((k) => k === "@id");

export const typesOf = (n: JsonLdNode) => jsonLdTypes(n);

/**
 * What Google needs to show a rich result, per type: every name in a list is required; «a|b» means one of them.
 * Article and FAQPage are checked by the AI search rules (C-4, C-7).
 */
export const REQUIRED: Record<string, string[]> = {
  Product: ["name", "offers|review|aggregateRating"],
  Offer: ["price|priceSpecification"],
  Event: ["name", "startDate", "location"],
  Recipe: ["name", "image"],
  VideoObject: ["name", "thumbnailUrl", "uploadDate"],
  LocalBusiness: ["name", "address"],
  Restaurant: ["name", "address"],
  Store: ["name", "address"],
  JobPosting: ["title", "datePosted", "description", "hiringOrganization"],
  Course: ["name", "description"],
  AggregateRating: ["ratingValue", "ratingCount|reviewCount"],
  Review: ["reviewRating", "author"],
  BreadcrumbList: ["itemListElement"],
  ListItem: ["position"],
};

/** Properties that hold an address, and those that hold a date. */
export const URL_KEYS = ["url", "image", "logo", "thumbnailUrl", "contentUrl", "sameAs", "item"];
export const DATE_KEYS = ["datePublished", "dateModified", "dateCreated", "uploadDate", "startDate", "endDate", "datePosted", "validThrough", "validFrom", "priceValidUntil"];
/** ISO 8601 as Google reads it: a date, or a date and time with an optional zone. */
export const ISO_DATE = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

/** Pages this deep or deeper get a breadcrumb trail; a language prefix (/ru) does not count as a level. */
export const BREADCRUMB_DEPTH = 2;
export const depthOf = (url: string) => {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts.length - (parts[0] && /^[a-z]{2}(-[a-z]{2})?$/i.test(parts[0]) ? 1 : 0);
};
