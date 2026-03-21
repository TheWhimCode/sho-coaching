// /engine/scheduling/availability/repository.ts

import { prisma } from "@/lib/prisma";
import { utcMidnight } from "../time/timeMath";

export async function getRulesForWeekdays(weekdays: number[]) {
  return prisma.availabilityRule.findMany({
    where: { weekday: { in: weekdays } },
  });
}

/** All weekday rules (one row per weekday). Used to batch availability without per-day DB reads. */
export async function getAllAvailabilityRules() {
  return prisma.availabilityRule.findMany();
}

export async function getExceptionsForDay(day: Date) {
  return prisma.availabilityException.findMany({
    where: { date: utcMidnight(day) },
    orderBy: { openMinute: "asc" },
  });
}

/**
 * Exceptions whose UTC calendar day falls in [fromInclusive, toExclusive).
 * Same ordering as getExceptionsForDay per day.
 */
export async function getAllAvailabilityExceptionsInRange(
  fromInclusive: Date,
  toExclusive: Date
) {
  return prisma.availabilityException.findMany({
    where: {
      date: { gte: fromInclusive, lt: toExclusive },
    },
    orderBy: [{ date: "asc" }, { openMinute: "asc" }],
  });
}
