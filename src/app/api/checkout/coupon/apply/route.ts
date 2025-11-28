// /api/checkout/coupon/apply/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { bookingId, code, discount } = await req.json();

  if (!bookingId) {
    return NextResponse.json({ error: "missing_bookingId" }, { status: 400 });
  }

  await prisma.session.update({
    where: { id: bookingId },
    data: {
      couponCode: code,
      couponDiscount: discount,
    },
  });

  return NextResponse.json({ applied: true });
}
