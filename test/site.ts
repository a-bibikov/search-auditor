import { createServer, type Server } from "node:http";

export interface Route {
  body?: string;
  type?: string;
  status?: number;
  headers?: Record<string, string>;
}
export type Routes = Record<string, Route>;

/**
 * Serves a fixture site on a random port. Unknown paths answer 404, or go to `fallback` when it returns a route
 * (a site that answers 200 for everything). A route with `headers.location` and a 3xx status is a redirect.
 */
export async function serve(routes: Routes, fallback?: (path: string) => Route | undefined): Promise<{ origin: string; close: () => Promise<void> }> {
  const server: Server = createServer((req, res) => {
    const path = (req.url ?? "/").split("?")[0]!;
    // A route keyed by the full address with its query wins: a page that answers parameters differently.
    const route = routes[req.url ?? "/"] ?? routes[path] ?? fallback?.(path);
    if (!route) {
      res.writeHead(404, { "content-type": "text/html" }).end("<h1>Not found</h1>");
      return;
    }
    res.writeHead(route.status ?? 200, { "content-type": route.type ?? "text/html; charset=utf-8", ...route.headers }).end(route.body ?? "");
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address() as { port: number };
  return { origin: `http://127.0.0.1:${port}`, close: () => new Promise((r) => server.close(() => r())) };
}

export const words = (n: number, seed = "answer") => Array.from({ length: n }, (_, i) => `${seed}${i % 7 ? "" : "s"}`).join(" ");

export const redirect = (to: string): Route => ({ status: 301, headers: { location: to } });

/** A page where every SEO field is explicit: leave one out (null) to break exactly that. */
export const html = (o: {
  title?: string | null;
  description?: string | null;
  canonical?: string | null;
  lang?: string | null;
  viewport?: boolean;
  charset?: boolean;
  icon?: boolean;
  head?: string;
  body: string;
}) => `<!doctype html><html${o.lang === null ? "" : ` lang="${o.lang ?? "en"}"`}><head>
${o.title === null ? "" : `<title>${o.title}</title>`}
${o.description ? `<meta name="description" content="${o.description}">` : ""}
${o.charset === false ? "" : `<meta charset="utf-8">`}
${o.viewport === false ? "" : `<meta name="viewport" content="width=device-width, initial-scale=1">`}
${o.icon === false ? "" : `<link rel="icon" href="/favicon.svg">`}
${o.canonical ? `<link rel="canonical" href="${o.canonical}">` : ""}
${o.head ?? ""}
</head><body><header><a href="/">Home</a></header><main>${o.body}</main></body></html>`;

export const DESCRIPTION = "A description long enough for a search result snippet, between fifty and one hundred sixty characters.";
