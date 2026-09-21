import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await prisma.whatNowCategory.findMany({ orderBy: { id: "asc" } });
    return NextResponse.json(categories, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load categories." }, { status: 500 });
  }
}
