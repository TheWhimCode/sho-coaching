import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { effectiveEnergy } from "@/lib/whatNow";

export const dynamic = "force-dynamic";

const taskInput = z.object({
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(5000).default(""),
  category: z.string().trim().min(1).max(40),
  subcategory: z.string().trim().max(80).optional(),
  energy: z.number().int().min(1).max(10).nullable().optional(),
  steps: z.array(z.string().trim().min(1).max(500)).max(40).optional(),
});

export async function POST(req: Request) {
  const parsed = taskInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the title and category." }, { status: 400 });
  try {
    const category = await prisma.whatNowCategory.findUnique({ where: { id: parsed.data.category } });
    if (!category) return NextResponse.json({ error: "Unknown category." }, { status: 400 });
    const task = await prisma.whatNowTask.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        category: parsed.data.category,
        subcategory: parsed.data.subcategory ?? "",
        energy: parsed.data.energy ?? null,
      },
    });
    const steps = parsed.data.steps ?? [];
    if (steps.length) {
      await prisma.$executeRawUnsafe(
        `UPDATE "admin"."WhatNowTask" SET "steps" = $1::jsonb WHERE "id" = $2`,
        JSON.stringify(steps),
        task.id,
      );
    }
    return NextResponse.json({
      source: "catalog",
      id: task.id,
      title: task.title,
      description: task.description,
      category: task.category,
      subcategory: task.subcategory,
      energy: effectiveEnergy(task.energy, category.defaultEnergy),
      energyOverride: task.energy,
      hidden: category.hidden,
      steps,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not save that." }, { status: 500 });
  }
}
