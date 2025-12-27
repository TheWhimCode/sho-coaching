import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const drafts = await prisma.draft.findMany({
    where: { status: "PENDING" },
  });

  // random order
  drafts.sort(() => Math.random() - 0.5);

  return NextResponse.json(drafts);
}
