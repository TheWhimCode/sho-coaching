import { SlotStatus } from "@prisma/client";

/** Smallest allocatable time unit */
export const SLOT_SIZE_MIN = 15 as const;

/** A single atomic availability unit */
export type Slot = {
  id: string;
  startTime: Date;          // UTC
  status: SlotStatus;       // free | taken | blocked
  holdUntil?: Date | null;
  holdKey?: string | null;
};

/** A contiguous reservation derived from slots */
export type SlotBlock = {
  startTime: Date;
  slotIds: string[];
  durationMin: number;
};

/** Constraints required to evaluate availability */
export type SchedulingLimits = {
  leadMinutes: number;
  maxAdvanceDays: number;
  perDayCap: number;
  bufferAfterMin: number;
};
