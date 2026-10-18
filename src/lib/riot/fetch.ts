import { bucketKeyFor, limiterGroup } from "./limiter";
import { enforceRequestLimit, RequestLimitError } from "@/lib/security/requestLimit";
import { AsyncLocalStorage } from "node:async_hooks";

const DEFAULT_TIMEOUT_MS = 12_000;
const lookupDeadline = new AsyncLocalStorage<number>();

export class RiotRequestLimitError extends RequestLimitError {
  constructor(retryAfter: number) {
    super(retryAfter);
    this.name = "RiotRequestLimitError";
    this.message = `Game lookups are busy for this region. Please try again in ${retryAfter} seconds.`;
  }
}

export function withRiotLookupDeadline<T>(task: () => Promise<T>): Promise<T> {
  return lookupDeadline.run(Date.now() + 20_000, task);
}

function remainingTime(deadline: number) {
  return Math.min(DEFAULT_TIMEOUT_MS, deadline - Date.now());
}

export class RiotApiError extends Error {
  readonly status: number;
  readonly endpoint: string;

  constructor(status: number, url: string, detail: string) {
    // Keep credentials and player identifiers out of error logs.
    const endpoint = new URL(url);
    const path = endpoint.pathname.split("/").slice(0, 5).join("/");
    super(`Riot API ${status}: ${detail}`);
    this.name = "RiotApiError";
    this.status = status;
    this.endpoint = `${endpoint.host}${path}`;
  }
}

export function riotLookupErrorMessage(error: unknown): string {
  if (error instanceof RiotApiError && (error.status === 401 || error.status === 403)) {
    return "Riot refused access to game data. Please try again later. If this keeps happening, the site owner needs to check Riot API access.";
  }
  return error instanceof Error ? error.message : "Riot lookup failed.";
}

function parseRetryAfter(res: Response): number {
  const ra =
    res.headers.get("Retry-After") ??
    res.headers.get("retry-after") ??
    res.headers.get("x-rate-limit-reset");
  const n = Number(ra);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.ceil(n), 300) : 10;
}

function riotHeaders() {
  const RIOT_API_KEY = process.env.RIOT_API_KEY?.trim();
  if (!RIOT_API_KEY) throw new Error("Missing RIOT_API_KEY");
  return { "X-Riot-Token": RIOT_API_KEY };
}

export async function riotFetchJSON<T>(
  url: string,
  init: RequestInit = {}
): Promise<T> {
  const target = new URL(url);
  if (target.protocol !== "https:" || target.port || target.username || target.password
    || !/^(euw1|eun1|na1|oc1|br1|la1|la2|tr1|ru|kr|jp1|ph2|sg2|th2|tw2|vn2|europe|americas|asia|sea)\.api\.riotgames\.com$/.test(target.hostname)) {
    throw new Error("Unsupported Riot API host");
  }
  const method = (init.method || "GET").toUpperCase();
  const key = bucketKeyFor(url, method);
  const limiter = limiterGroup.key(key);
  const deadline = lookupDeadline.getStore() ?? Infinity;

  if (remainingTime(deadline) <= 0) throw new Error("Riot lookup timed out");
  return limiter.schedule({ expiration: Math.min(DEFAULT_TIMEOUT_MS * 2, deadline - Date.now()) }, async () => {
    if (remainingTime(deadline) <= 0) throw new Error("Riot lookup timed out");
    try {
      await enforceRequestLimit(`riot-outbound:${key}:two-minutes`, 90, 120_000);
      await enforceRequestLimit(`riot-outbound:${key}:second`, 18, 1000);
    } catch (error) {
      if (error instanceof RequestLimitError) throw new RiotRequestLimitError(error.retryAfter);
      throw error;
    }
    const timeout = remainingTime(deadline);
    if (timeout <= 0) throw new Error("Riot lookup timed out");
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), timeout);
    try {
      const res = await fetch(url, {
        ...init,
        signal: ac.signal,
        headers: { ...riotHeaders(), ...(init.headers || {}) },
        cache: "no-store",
        redirect: "error",
      });

      if (res.status === 429) {
        // Do not recursively re-enter a limiter while holding one of its slots.
        throw new RiotRequestLimitError(parseRetryAfter(res));
      }

      if (!res.ok) {
        const errTxt = await res.text().catch(() => "");
        throw new RiotApiError(res.status, url, errTxt || res.statusText);
      }

      return (await res.json()) as T;
    } finally {
      clearTimeout(to);
    }
  });
}
