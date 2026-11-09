import tls from "node:tls";
import { DEFAULT_UA, toPublic, toTarget, type Origins } from "auditor-engine";
import type { Certificate } from "./types.ts";

const REDIRECT = new Set([301, 302, 303, 307, 308]);
const MAX_HOPS = 10;

/**
 * Follows redirects one at a time, the way a crawler counts them: fetch with redirect: "follow" hides the steps.
 * Returns the public URL of every hop after the first, whether it looped, and the final status.
 */
export async function trace(url: string, o: Origins, timeoutMs = 10_000): Promise<{ hops: string[]; loop: boolean; status: number }> {
  const seen = new Set([url]);
  const hops: string[] = [];
  let current = url;
  for (let i = 0; i < MAX_HOPS; i++) {
    let res: Response;
    try {
      res = await fetch(toTarget(current, o), { redirect: "manual", headers: { "user-agent": DEFAULT_UA }, signal: AbortSignal.timeout(timeoutMs) });
      await res.body?.cancel();
    } catch {
      return { hops, loop: false, status: 0 };
    }
    const location = res.headers.get("location");
    if (!REDIRECT.has(res.status) || !location) return { hops, loop: false, status: res.status };
    const next = toPublic(new URL(location, toTarget(current, o)).href, o);
    hops.push(next);
    if (seen.has(next)) return { hops, loop: true, status: res.status };
    seen.add(next);
    current = next;
  }
  return { hops, loop: false, status: 0 };
}

/** Time to the response headers, in ms: what a crawler waits before the page starts to arrive. */
export async function timeToFirstByte(url: string, o: Origins, timeoutMs = 10_000): Promise<number | null> {
  const start = performance.now();
  try {
    const res = await fetch(toTarget(url, o), { headers: { "user-agent": DEFAULT_UA }, signal: AbortSignal.timeout(timeoutMs) });
    const ms = performance.now() - start;
    await res.body?.cancel();
    return res.ok ? Math.round(ms) : null;
  } catch {
    return null;
  }
}

/** The first answer to a URL without following redirects: its status and Location. */
export async function firstHop(url: string, timeoutMs = 10_000): Promise<{ status: number; location: string } | null> {
  try {
    const res = await fetch(url, { redirect: "manual", headers: { "user-agent": DEFAULT_UA }, signal: AbortSignal.timeout(timeoutMs) });
    await res.body?.cancel();
    return { status: res.status, location: res.headers.get("location") ?? "" };
  } catch {
    return null;
  }
}

/** Opens a TLS connection to the host and reads its certificate: trusted or not, and how long it has left. */
export function certificateOf(host: string, timeoutMs = 10_000): Promise<Certificate | null> {
  return new Promise((resolve) => {
    // rejectUnauthorized: false so an expired or self-signed certificate is reported, not thrown away.
    const socket = tls.connect({ host, port: 443, servername: host, rejectUnauthorized: false, timeout: timeoutMs }, () => {
      const cert = socket.getPeerCertificate();
      socket.end();
      if (!cert?.valid_to) return resolve(null);
      const daysLeft = Math.floor((new Date(cert.valid_to).getTime() - Date.now()) / 86_400_000);
      const error = socket.authorizationError ? String(socket.authorizationError) : undefined;
      resolve({ valid: socket.authorized, ...(error ? { error } : {}), daysLeft, validTo: new Date(cert.valid_to).toISOString().slice(0, 10) });
    });
    socket.on("error", () => resolve(null));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(null);
    });
  });
}
