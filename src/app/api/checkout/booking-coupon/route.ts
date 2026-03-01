// Return couponCode and couponDiscount for an unpaid booking (e.g. to hydrate UI after refresh).
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get("bookingId");
  if (!bookingId) {
    return NextResponse.json({ error: "missing_bookingId" }, { status: 400 });
  }

  const s = await prisma.session.findFirst({
    where: { id: bookingId, status: "unpaid" },
    select: { couponCode: true, couponDiscount: true },
  });

  if (!s) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    couponCode: s.couponCode ?? null,
    couponDiscount: s.couponDiscount ?? 0,
  });
}
