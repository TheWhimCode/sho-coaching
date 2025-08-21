import { SlotStatus } from "@prisma/client";

export type Slot = {
  id: string;
  startTime: string;            // ISO
  status: SlotStatus;           // free | blocked | taken
};

export async function fetchSlots(from: Date, to: Date, _liveMinutes?: number): Promise<Slot[]> {
  const params = new URLSearchParams({
    from: from.toISOString(),
    to: to.toISOString(),
    ...( _liveMinutes ? { liveMinutes: String(_liveMinutes) } : {} ),
  });
  const res = await fetch(`/api/slots?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load availability");
  return res.json();
}
