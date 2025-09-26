// src/app/api/admin/bookings/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/bookings?range=upcoming|all&limit=200
 * Returns minimal booking info for the Admin Bookings page.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const range = (searchParams.get("range") || "upcoming").toLowerCase();
  const limit = Math.min(parseInt(searchParams.get("limit") || "200", 10) || 200, 1000);

  const now = new Date();

  const where = {
    status: "paid" as const,
    ...(range === "upcoming" ? { scheduledStart: { gte: now } } : {}),
  };

  const rows = await prisma.session.findMany({
    where,
    select: {
      id: true,
      liveMinutes: true,
      discord: true,
      sessionType: true,
      followups: true,
      notes: true,
      scheduledStart: true,
    },
    orderBy: [{ scheduledStart: "asc" }, { createdAt: "desc" }],
    take: limit,
  });

  return NextResponse.json(rows);
}
