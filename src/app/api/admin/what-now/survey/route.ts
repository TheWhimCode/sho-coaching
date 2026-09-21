import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { filterFromChoice, type SurveyQuestion, type SurveyTree } from "@/lib/whatNowSurvey";

export const dynamic = "force-dynamic";

type QuestionRow = { id: string; prompt: string; sortOrder: number };
type ChoiceRow = {
  id: string;
  questionId: string;
  label: string;
  next: string | null;
  minEnergy: number | null;
  maxEnergy: number | null;
  categories: string[];
  sortOrder: number;
};

export async function GET() {
  try {
    const [questions, choices] = await Promise.all([
      prisma.$queryRaw<QuestionRow[]>`SELECT "id", "prompt", "sortOrder" FROM "admin"."WhatNowQuestion" ORDER BY "sortOrder" ASC`,
      prisma.$queryRaw<ChoiceRow[]>`SELECT "id", "questionId", "label", "next", "minEnergy", "maxEnergy", "categories", "sortOrder" FROM "admin"."WhatNowChoice" ORDER BY "sortOrder" ASC`,
    ]);
    if (!questions.length) return NextResponse.json({ error: "Survey is not ready." }, { status: 500 });
    const tree: SurveyTree = {
      start: questions[0].id,
      questions: Object.fromEntries(questions.map(question => {
        const item: SurveyQuestion = {
          id: question.id,
          prompt: question.prompt,
          choices: choices.filter(choice => choice.questionId === question.id).map(choice => ({
            id: choice.id,
            label: choice.label,
            next: choice.next ?? undefined,
            filter: filterFromChoice({
              minEnergy: choice.minEnergy,
              maxEnergy: choice.maxEnergy,
              categories: choice.categories ?? [],
            }),
          })),
        };
        return [question.id, item];
      })),
    };
    return NextResponse.json(tree, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not load the survey." }, { status: 500 });
  }
}
