import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { activitySteps, effectiveEnergy, type WhatNowCandidate } from "@/lib/whatNow";

export const dynamic = "force-dynamic";

type TaskRow = {
  id: string;
  title: string;
  description: string;
  energy: number | null;
  category: string;
  subcategory: string;
  steps: unknown;
};

async function loadTasks(): Promise<TaskRow[]> {
  try {
    return await prisma.$queryRaw<TaskRow[]>`SELECT "id", "title", "description", "energy", "category", "subcategory", COALESCE("steps", '[]'::jsonb) AS "steps" FROM "admin"."WhatNowTask"`;
  } catch {
    const tasks = await prisma.whatNowTask.findMany();
    return tasks.map(task => ({ ...task, steps: [] }));
  }
}

export async function GET() {
  try {
    const [categories, ideas] = await Promise.all([
      prisma.whatNowCategory.findMany(),
      prisma.socialIdea.findMany({ where: { status: { not: "completed" } } }),
    ]);
    const tasks = await loadTasks();
    const hidden = Object.fromEntries(categories.map(category => [category.id, category.hidden]));
    const defaults = Object.fromEntries(categories.map(category => [category.id, category.defaultEnergy]));
    const studio: WhatNowCandidate[] = ideas.map(idea => ({
      source: "studio",
      id: idea.id,
      title: idea.title,
      description: idea.notes,
      category: idea.platform,
      subcategory: "",
      energy: effectiveEnergy(idea.energy, defaults[idea.platform]),
      energyOverride: idea.energy,
      hidden: Boolean(hidden[idea.platform]),
      plannedDate: idea.plannedDate,
      steps: activitySteps(idea.checklist),
    }));
    const catalog: WhatNowCandidate[] = tasks.map(task => ({
      source: "catalog",
      id: task.id,
      title: task.title,
      description: task.description,
      category: task.category,
      subcategory: task.subcategory,
      energy: effectiveEnergy(task.energy, defaults[task.category]),
      energyOverride: task.energy,
      hidden: Boolean(hidden[task.category]),
      steps: activitySteps(task.steps),
    }));
    return NextResponse.json([...catalog, ...studio], { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load activities." }, { status: 500 });
  }
}
