import { SlotStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

import type { SchedulingLimits } from "../model";
import { getAvailableSlots } from "../slots/getAvailableSlots";

export type AvailableStartRow = {
  id: string;
  startTime: Date;
  status: SlotStatus;
};

export type ListAvailableStartsInput = {
  from: Date;
  to: Date;
  liveMinutes: number;
  limits: SchedulingLimits;
  maxRows?: number;
};

/**
 * Server-side availability listing.
 * Thin wrapper around the scheduling engine.
 */
export async function listAvailableStarts(
  input: ListAvailableStartsInput
): Promise<AvailableStartRow[]> {
  const { from, to, liveMinutes, maxRows = 2000 } = input;

  const slots = await getAvailableSlots(
    { from, to, liveMinutes },
    prisma
  );

  if (slots.length > maxRows) {
    throw new Error("too_many_results");
  }

  return slots.map((s) => ({
    id: s.id,
    startTime: s.startTime,
    status: SlotStatus.free,
  }));
}
