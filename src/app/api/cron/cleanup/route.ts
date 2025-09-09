import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const result = await prisma.booking.deleteMany({
    where: {
      status: "unpaid",
      createdAt: { lt: cutoff },
    },
  });
  return NextResponse.json({ deleted: result.count });
}
