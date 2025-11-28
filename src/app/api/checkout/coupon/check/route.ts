// /api/checkout/coupon/check/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { code, studentId } = await req.json();

  const coupon = await prisma.coupon.findUnique({
    where: { code },
  });

  if (!coupon) {
    return NextResponse.json({ valid: false, reason: "not-found" });
  }

  // owner using own code
  if (coupon.studentId === studentId) {
    return NextResponse.json({
      valid: true,
      type: "owner",
      discount: coupon.value ?? 5,
    });
  }

  // registered student using someone else's code
  if (studentId && coupon.studentId !== studentId) {
    return NextResponse.json({
      valid: false,
      reason: "wrong-student",
    });
  }

  // new student: referral
  return NextResponse.json({
    valid: true,
    type: "referral",
    discount: 5,
  });
}
