import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDayKey, reorderIdeasSchema, socialIdeaSchema } from "@/lib/socialIdeas";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const today = new URL(req.url).searchParams.get("today");
    if (today && isDayKey(today)) {
      await prisma.socialIdea.updateMany({
        where: { plannedDate: { not: null, lt: today }, status: { not: "completed" } },
        data: { plannedDate: null, placedAt: null },
      });
    }
    const ideas = await prisma.socialIdea.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
    return NextResponse.json(ideas, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load your ideas." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const parsed = socialIdeaSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the title, checklist, and planned date." }, { status: 400 });
  try {
    const idea = await prisma.$transaction(async tx => {
      const top = await tx.socialIdea.aggregate({ where: { platform: parsed.data.platform }, _min: { sortOrder: true } });
      return tx.socialIdea.create({
        data: {
          ...parsed.data,
          status: parsed.data.status ?? "idea",
          sortOrder: (top._min.sortOrder ?? 1) - 1,
          placedAt: parsed.data.plannedDate ? new Date() : null,
        },
      });
    });
    return NextResponse.json(idea, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not save your idea. Try again." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const parsed = reorderIdeasSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the order of this category." }, { status: 400 });
  try {
    const ideas = await prisma.socialIdea.findMany({ where: { id: { in: parsed.data.ids } }, select: { id: true, platform: true } });
    if (ideas.length !== parsed.data.ids.length) return NextResponse.json({ error: "A card in this category is missing. Refresh the board." }, { status: 404 });
    const platform = ideas[0]?.platform;
    if (!platform || ideas.some(idea => idea.platform !== platform)) return NextResponse.json({ error: "Cards can only be reordered inside the same category." }, { status: 400 });
    await prisma.$transaction(parsed.data.ids.map((id, sortOrder) => prisma.socialIdea.update({ where: { id }, data: { sortOrder } })));
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Could not save the new order. Try again." }, { status: 500 });
  }
}
