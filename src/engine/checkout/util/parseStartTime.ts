// engine/checkout/util/parseStartTime.ts
// Parse startTime from payload, backend, or query into Date | null.

/**
 * Coerce a value to a valid Date or null (for startTime from payload/backend/query).
 */
export function parseStartTime(v: unknown): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === "number") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}
