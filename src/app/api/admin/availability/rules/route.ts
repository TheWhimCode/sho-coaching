import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const Body = z.object({
  rules: z.array(
    z.object({
      open: z.string(),  // "HH:MM"
      close: z.string(), // "HH:MM" or "24:00"
    })
  ).length(7), // must be 7 entries, Sun–Sat
});

function hhmmToMinutes(hhmm: string) {
  if (hhmm === "24:00") return 24 * 60;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// --- GET: return all 7 rules ---
export async function GET() {
  const rules = await prisma.availabilityRule.findMany({
    orderBy: { weekday: "asc" },
  });

  // Normalize to 7 entries (Sun=0..Sat=6) with defaults if missing
  const defaults = Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    openMinute: 13 * 60,   // 13:00
    closeMinute: 24 * 60,  // 24:00
  }));

  const byDay = new Map(rules.map(r => [r.weekday, r]));
  const normalized = defaults.map(d => byDay.get(d.weekday) ?? d);

  return NextResponse.json(normalized);
}

// --- POST: overwrite rules for all weekdays ---
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const now = new Date();

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
}
