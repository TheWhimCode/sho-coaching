import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`booking:update-waiver:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid_json" }, { status: 400 });

  const { bookingId, waiverAccepted } = body as {
    bookingId?: string;
    waiverAccepted?: boolean;
  };

  if (!bookingId) return NextResponse.json({ error: "missing_bookingId" }, { status: 400 });

  try {
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        waiverAccepted: waiverAccepted === true,
        waiverIp: waiverAccepted ? ip : null,
        waiverAcceptedAt: waiverAccepted ? new Date() : null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[update-waiver] error", msg);
    return NextResponse.json({ error: "internal_error", detail: msg }, { status: 500 });
  }
}
