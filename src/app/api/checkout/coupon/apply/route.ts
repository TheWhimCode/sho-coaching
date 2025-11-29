// /api/checkout/coupon/apply/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { bookingId, code, studentId } = await req.json();

  if (!bookingId) {
    return NextResponse.json({ error: "missing_bookingId" }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "missing_coupon" }, { status: 400 });
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code },
  });

  if (!coupon) {
    return NextResponse.json(
      { valid: false, reason: "not-found" },
      { status: 400 }
    );
  }

  // owner using own code
  if (coupon.studentId === studentId) {
    const discount = coupon.value ?? 5;

    await prisma.session.update({
      where: { id: bookingId },
      data: {
        couponCode: code,
        couponDiscount: discount,
      },
    });

    return NextResponse.json({ applied: true, type: "owner", discount });
  }

  // registered student using someone else's code
  if (studentId && coupon.studentId !== studentId) {
    return NextResponse.json(
      { valid: false, reason: "wrong-student" },
      { status: 403 }
    );
  }

  // new student: referral
  const discount = 5;
  await prisma.session.update({
    where: { id: bookingId },
    data: {
      couponCode: code,
      couponDiscount: discount,
    },
  });

  return NextResponse.json({ applied: true, type: "referral", discount });
}
