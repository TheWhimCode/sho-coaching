import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// "16:00" -> 960
function hhmmToMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) throw new Error("Bad time");
  return h * 60 + m;
}

const Body = z.object({
  // exactly 7 entries: Sun..Sat, as your UI sends
  rules: z
    .array(
      z.object({
        open: z.string().regex(/^\d{2}:\d{2}$/),
        close: z.string().regex(/^\d{2}:\d{2}$/),
      })
    )
    .length(7),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { rules } = parsed.data;
  const now = new Date();

  // build 7 rows (0=Sun … 6=Sat)
  const rows = rules.map((r, weekday) => ({
    weekday,
    openMinute: hhmmToMinutes(r.open),
    closeMinute: hhmmToMinutes(r.close),
    effectiveFrom: now,
  }));

  // keep history by inserting a new "version" (one row per weekday)
  await prisma.availabilityRule.createMany({ data: rows });

  return NextResponse.json({ ok: true, inserted: rows.length, effectiveFrom: now.toISOString() });
}
