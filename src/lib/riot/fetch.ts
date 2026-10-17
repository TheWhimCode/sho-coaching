import { bucketKeyFor, limiterGroup } from "./limiter";

const DEFAULT_TIMEOUT_MS = 12_000;

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

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function parseRetryAfter(res: Response): number {
  const ra =
    res.headers.get("Retry-After") ??
    res.headers.get("retry-after") ??
    res.headers.get("x-rate-limit-reset");
  const n = Number(ra);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 10) : 1;
}

function riotHeaders() {
  const RIOT_API_KEY = process.env.RIOT_API_KEY?.trim();
  if (!RIOT_API_KEY) throw new Error("Missing RIOT_API_KEY");
  return { "X-Riot-Token": RIOT_API_KEY };
}

export async function riotFetchJSON<T>(
  url: string,
  init: RequestInit = {},
  attempt = 0
): Promise<T> {
  const method = (init.method || "GET").toUpperCase();
  const key = bucketKeyFor(url, method);
  const limiter = limiterGroup.key(key);

  return limiter.schedule({ expiration: DEFAULT_TIMEOUT_MS * 2 }, async () => {
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), DEFAULT_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        ...init,
        signal: ac.signal,
        headers: { ...riotHeaders(), ...(init.headers || {}) },
        cache: "no-store",
      });

      if (res.status === 429) {
        const wait = parseRetryAfter(res);
        await sleep((wait + Math.random()) * 1000);
        if (attempt < 3) return riotFetchJSON<T>(url, init, attempt + 1);
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
