'use client';

export async function holdSlot(slotId: string, liveMinutes: number, holdKey?: string) {
  const res = await fetch("/api/holds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slotId, liveMinutes, holdKey }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Hold failed");

  // API returns { ok, holdUntil, holdKey, slotIds }
  return data as { ok: true; holdUntil: string; holdKey: string; slotIds: string[] };
}

export async function releaseHold(holdKey?: string) {
  try {
    await fetch("/api/holds", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ holdKey }),
    });
  } catch {}
}
