export async function holdSlot(slotId: string, holdKey?: string) {
  const res = await fetch("/api/holds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slotId, holdKey }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Hold failed");
  // expects API to return { ok:true, holdUntil, holdKey }
  return data as { ok: true; holdUntil: string; holdKey: string };
}

export async function releaseHold(slotId: string, holdKey?: string) {
  try {
    await fetch("/api/holds", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId, holdKey }),
    });
  } catch {}
}
