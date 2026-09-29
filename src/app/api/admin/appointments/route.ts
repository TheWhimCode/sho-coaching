import { prisma } from "@/lib/prisma";
import { z } from "zod";

const appointmentSchema = z.object({
  title: z.string().trim().min(1).max(180),
  plannedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  plannedTime: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().trim().max(5000).default(""),
});

export async function POST(request: Request) {
  const parsed = appointmentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Choose a date, time, and event name." }, { status: 400 });
  const item = await prisma.socialIdea.create({ data: {
    ...parsed.data,
    platform: "appointment",
    status: "idea",
    checklist: [],
    energy: null,
    sortOrder: 0,
    placedAt: new Date(),
  } });
  return Response.json(item, { status: 201 });
}
