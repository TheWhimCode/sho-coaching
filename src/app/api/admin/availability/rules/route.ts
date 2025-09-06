// /app/api/admin/availability/rules/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* -------------------- validation -------------------- */
const timeZ = z.union([
  z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), // 00:00–23:59
  z.literal("24:00"),                             // special close (= midnight)
]);

const Body = z.object({
  rules: z.array(
    z.object({
      open: timeZ,   // "HH:MM"
      close: timeZ,  // "HH:MM" or "24:00"
    })
  ).length(7), // Sun..Sat
});

/* -------------------- helpers -------------------- */
function hhmmToMinutes(hhmm: string) {
  if (hhmm === "24:00") return 24 * 60;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function clamp(n: number) {
  return Math.max(0, Math.min(1440, n));
}

/* -------------------- GET: return all 7 rules -------------------- */
export async function GET() {
  try {
    const rules = await prisma.availabilityRule.findMany({
      orderBy: { weekday: "asc" },
    });

    // Ensure 7 entries (0..6) with defaults if missing
    const defaults = Array.from({ length: 7 }, (_, weekday) => ({
      weekday,
      openMinute: 13 * 60,  // 13:00
      closeMinute: 24 * 60, // 24:00 (exclusive)
    }));

    const byDay = new Map(rules.map(r => [r.weekday, r]));
    const normalized = defaults.map(d => {
      const r = byDay.get(d.weekday);
      return r
        ? {
            weekday: r.weekday,
            openMinute: clamp(r.openMinute),
            closeMinute: clamp(r.closeMinute),
          }
        : d;
    });

    return NextResponse.json(normalized);
  } catch (e: any) {
    console.error("GET /availability/rules failed:", e);
    return NextResponse.json(
      { error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}

/* -------------------- POST: overwrite all weekdays -------------------- */
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const now = new Date();

    // Upsert 7 rows (relies on @unique on weekday)
    await Promise.all(
      parsed.data.rules.map((rule, weekday) =>
        prisma.availabilityRule.upsert({
          where: { weekday },
          update: {
            openMinute: hhmmToMinutes(rule.open),
            closeMinute: hhmmToMinutes(rule.close),
            effectiveFrom: now,
          },
          create: {
            weekday,
            openMinute: hhmmToMinutes(rule.open),
            closeMinute: hhmmToMinutes(rule.close),
            effectiveFrom: now,
          },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("POST /availability/rules failed:", e);
    // Surface Prisma and runtime errors to the client toast
    return NextResponse.json(
      { error: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
