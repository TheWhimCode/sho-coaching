import { SlotStatus } from "@prisma/client";

export type Slot = {
  id: string;
  startTime: string; // ISO
  status: SlotStatus; // free | blocked | taken
};

/** Same query string as fetch — used to dedupe. */
function slotsQueryKey(
  from: Date,
  to: Date,
  _liveMinutes?: number,
  holdKey?: string | null,
  preset?: string | null
): string {
  const params = new URLSearchParams({
    from: from.toISOString(),
    to: to.toISOString(),
    ...(_liveMinutes ? { liveMinutes: String(_liveMinutes) } : {}),
    ...(holdKey ? { holdKey } : {}),
    ...(preset ? { preset } : {}),
  });
  return params.toString();
}

/** In-flight: identical concurrent calls share one network request. */
const inFlightSlots = new Map<string, Promise<Slot[]>>();

/**
 * Very short memo of the last successful response per exact query string.
 * Catches React Strict Mode double effect / back-to-back identical calls without
 * delaying UX (no debounce timer — instant return when fresh).
 */
const RECENT_TTL_MS = 400;
let recentSuccess: { key: string; slots: Slot[]; at: number } | null = null;

function tryRecentSlots(key: string): Slot[] | null {
  if (!recentSuccess || recentSuccess.key !== key) return null;
  if (Date.now() - recentSuccess.at > RECENT_TTL_MS) {
    recentSuccess = null;
    return null;
  }
  return recentSuccess.slots.slice();
}

function rememberRecent(key: string, slots: Slot[]) {
  recentSuccess = { key, slots: slots.slice(), at: Date.now() };
}

/**
 * Load free slot starts for the given window and session length.
 * Identical concurrent requests are deduped; identical sequential requests within
 * ~400ms reuse the last result (CU-friendly, same UX as a single fast refetch).
 */
export async function fetchSlots(
  from: Date,
  to: Date,
  _liveMinutes?: number,
  holdKey?: string | null,
  preset?: string | null
): Promise<Slot[]> {
  const key = slotsQueryKey(from, to, _liveMinutes, holdKey, preset);

  const cached = tryRecentSlots(key);
  if (cached) return Promise.resolve(cached);

  const existing = inFlightSlots.get(key);
  if (existing) return existing;

  const promise = (async (): Promise<Slot[]> => {
    try {
      const res = await fetch(`/api/slots?${key}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load availability");
      const data = (await res.json()) as Slot[];
      rememberRecent(key, data);
      return data;
    } finally {
      queueMicrotask(() => {
        inFlightSlots.delete(key);
      });
    }
  })();

  inFlightSlots.set(key, promise);
  return promise;
}
