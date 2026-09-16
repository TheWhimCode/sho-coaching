import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { socialIdeaSchema } from "@/lib/socialIdeas";

type Context = { params: Promise<{ id: string }> };

function failure(error: unknown) {
  const missing = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
  return NextResponse.json({ error: missing ? "This idea no longer exists. Refresh the board." : "Could not save your change. Try again." }, { status: missing ? 404 : 500 });
}

export async function PATCH(req: Request, context: Context) {
  const parsed = socialIdeaSchema.partial().strict().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the title, date, and reference link." }, { status: 400 });
  const { id } = await context.params;
  try {
    return NextResponse.json(await prisma.socialIdea.update({ where: { id }, data: parsed.data }));
  } catch (error) { return failure(error); }
}

export async function DELETE(_req: Request, context: Context) {
  const { id } = await context.params;
  try {
    await prisma.socialIdea.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) { return failure(error); }
}
