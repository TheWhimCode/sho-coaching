import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const exerciseNames = ["Hip thrust", "Sumo squat", "Lunge", "Split squat"] as const;
const workoutSchema = z.object({
  workoutDate: z.string().regex(datePattern),
  exercise: z.enum(exerciseNames),
  sets: z.number().int().min(1).max(100),
  reps: z.number().int().min(1).max(1_000),
  weightKg: z.number().min(0).max(1_000),
});
const updateSchema = workoutSchema.extend({ id: z.string().min(1) });

export async function GET(request: Request) {
  const workoutDate = new URL(request.url).searchParams.get("date");
  if (!workoutDate || !datePattern.test(workoutDate)) return Response.json({ error: "Choose a valid workout date." }, { status: 400 });
  const entries = await prisma.workoutLog.findMany({ where: { workoutDate }, orderBy: { exercise: "asc" } });
  return Response.json(entries, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const parsed = workoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter a valid exercise, sets, reps, and load." }, { status: 400 });
  const entry = await prisma.workoutLog.create({ data: parsed.data });
  return Response.json(entry);
}

export async function PUT(request: Request) {
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter a valid exercise, sets, reps, and load." }, { status: 400 });
  const { id, ...data } = parsed.data;
  const entry = await prisma.workoutLog.update({ where: { id }, data }).catch(() => null);
  if (!entry) return Response.json({ error: "This workout entry no longer exists." }, { status: 404 });
  return Response.json(entry);
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Missing workout entry." }, { status: 400 });
  await prisma.workoutLog.delete({ where: { id } }).catch(() => null);
  return Response.json({ ok: true });
}
