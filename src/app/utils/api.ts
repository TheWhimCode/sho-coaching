export type Slot = { id: string; startTime: string; isTaken: boolean };

export async function fetchSlots(from: Date, to: Date, _liveMinutes?: number): Promise<Slot[]> {
  const params = new URLSearchParams({
    from: from.toISOString(),
    to: to.toISOString(),
  });
  const res = await fetch(`/api/slots?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load availability");
  return res.json();
}
