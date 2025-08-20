import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  date: z.string(),          // "YYYY-MM-DD"
  open: z.string().optional(),
  close: z.string().optional(),
  blocked: z.boolean().default(false),
});

function hhmmToMinutes(hhmm?: string) {
  if (!hhmm) return undefined;
  if (hhmm === "24:00") return 24 * 60;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const d = new Date(parsed.data.date);
  d.setUTCHours(0,0,0,0);

  const data = {
    date: d,
    blocked: parsed.data.blocked,
    openMinute: hhmmToMinutes(parsed.data.open),
    closeMinute: hhmmToMinutes(parsed.data.close),
  };

  await prisma.availabilityException.upsert({
    where: { date: d },
    update: data,
    create: data,
  });

  return NextResponse.json({ ok: true });
}
