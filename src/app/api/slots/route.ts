import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guards } from "@/lib/booking/block";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");
  if (!fromStr || !toStr) {
    return NextResponse.json({ error: "from/to required" }, { status: 400 });
  }

  const from = new Date(fromStr);
  const to = new Date(toStr);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return NextResponse.json({ error: "invalid dates" }, { status: 400 });
  }

  // Enforce global guards (lead time / advance window / opening hours)
  const { minStart, maxStart, isWithinHours } = guards(new Date());

  // Clamp the requested window to allowed range
  const gte = from < minStart ? minStart : from;
  const lte = to > maxStart ? maxStart : to;

  const rows = await prisma.slot.findMany({
    where: {
      isTaken: false,
      startTime: { gte, lte },
    },
    select: { id: true, startTime: true, isTaken: true },
    orderBy: { startTime: "asc" },
  });

  // Filter out anything outside opening hours (hours are evaluated in local time)
  const filtered = rows.filter(r => isWithinHours(new Date(r.startTime)));

  return NextResponse.json(filtered);
}
