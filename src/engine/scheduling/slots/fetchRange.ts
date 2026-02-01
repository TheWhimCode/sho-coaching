export type AvailabilityRange = { from: Date; to: Date };

/**
 * UI-only range helper.
 * No policy, no lead time, no max advance.
 */
export function fetchRange(
  now: Date,
  horizonDays: number
): AvailabilityRange {
  const from = new Date(now);
  from.setUTCHours(0, 0, 0, 0);

  const to = new Date(from);
  to.setUTCDate(to.getUTCDate() + horizonDays);
  to.setUTCHours(23, 59, 59, 999);

  return { from, to };
}

