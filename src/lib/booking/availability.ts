import { prisma } from "@/lib/prisma";

export async function getDayAvailability(date: Date) {
  const weekday = date.getDay(); // 0–6
  const midnight = new Date(date);
  midnight.setHours(0,0,0,0);

  // exceptions override rules
  const exception = await prisma.availabilityException.findUnique({
    where: { date: midnight },
  });
  if (exception) {
    if (exception.blocked) return null;
    return { openMinute: exception.openMinute ?? 0, closeMinute: exception.closeMinute ?? 24*60 };
  }

  // otherwise use latest rule in effect
  const rule = await prisma.availabilityRule.findFirst({
    where: { weekday, effectiveFrom: { lte: new Date() } },
    orderBy: { effectiveFrom: "desc" },
  });
  if (!rule) return null;
  return { openMinute: rule.openMinute, closeMinute: rule.closeMinute };
}
