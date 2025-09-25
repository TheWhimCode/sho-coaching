import { bucketKeyFor, limiterGroup } from "./limiter";

const RIOT_API_KEY = process.env.RIOT_API_KEY!;
const DEFAULT_TIMEOUT_MS = 12_000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseRetryAfter(res: Response): number {
  const ra =
    res.headers.get("Retry-After") ??
    res.headers.get("retry-after") ??
    res.headers.get("x-rate-limit-reset");
  const n = Number(ra);
  if (Number.isFinite(n) && n > 0) return Math.min(n, 10);
  return 1;
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
        headers: {
          "X-Riot-Token": RIOT_API_KEY,
          ...(init.headers || {}),
        },
        cache: "no-store",
      });

      if (res.status === 429) {
        const wait = parseRetryAfter(res);
        await sleep((wait + Math.random()) * 1000);
        if (attempt < 3) return riotFetchJSON<T>(url, init, attempt + 1);
      }

      if (res.status === 403) {
        const body = await res.text().catch(() => "");
        throw new Error(`Riot API 403 (key?): ${body || "Forbidden"}`);
      }

      if (!res.ok) {
        const errTxt = await res.text().catch(() => "");
        throw new Error(`Riot API ${res.status}: ${errTxt || res.statusText}`);
      }

      return (await res.json()) as T;
    } finally {
      clearTimeout(to);
    }
  });
}
