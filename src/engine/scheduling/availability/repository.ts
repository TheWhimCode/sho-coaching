// /engine/scheduling/availability/repository.ts

import { prisma } from "@/lib/prisma";
import { utcMidnight } from "../time/timeMath";

export async function getRulesForWeekdays(weekdays: number[]) {
  return prisma.availabilityRule.findMany({
    where: { weekday: { in: weekdays } },
  });
}

export async function getExceptionsForDay(day: Date) {
  return prisma.availabilityException.findMany({
    where: { date: utcMidnight(day) },
    orderBy: { openMinute: "asc" },
  });
}
