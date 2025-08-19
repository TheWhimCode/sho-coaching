import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guards, canStartAtTime } from "@/lib/booking/block";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");
  const liveMinutes = Number(searchParams.get("liveMinutes") || "60");

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

  // Base query: only untaken slots in range
  const rows = await prisma.slot.findMany({
    where: {
      isTaken: false,
      startTime: { gte, lte },
    },
    select: { id: true, startTime: true },
    orderBy: { startTime: "asc" },
  });

  // Step 1: respect opening hours
  const filtered = rows.filter((r) => isWithinHours(new Date(r.startTime)));

  // Step 2: continuity + buffer check (parallelized, no redundant overlap query)
  const checked = await Promise.all(
    filtered.map(async (r) => {
      const ok = await canStartAtTime(r.startTime, liveMinutes, prisma);
      return ok ? r : null;
    })
  );

  const valid = checked.filter((x): x is typeof filtered[number] => Boolean(x));

  return NextResponse.json(valid);
}
