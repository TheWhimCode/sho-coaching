import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { socialIdeaSchema } from "@/lib/socialIdeas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ideas = await prisma.socialIdea.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(ideas, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load your ideas." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const parsed = socialIdeaSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the title, checklist, and planned date." }, { status: 400 });
  try {
    return NextResponse.json(await prisma.socialIdea.create({ data: { ...parsed.data, placedAt: parsed.data.plannedDate ? new Date() : null } }), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not save your idea. Try again." }, { status: 500 });
  }
}
