import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Role = "top" | "jng" | "mid" | "adc" | "sup";
type Side = "blue" | "red";

type Pick = {
  role: Role;
  champ: string | null;
};

type DraftAnswer = {
  champ: string;
  explanation: string;
  correct?: true;
};

type CreateDraftInput = {
  role: Role;
  userTeam: Side;
  blue: Pick[];
  red: Pick[];
  answers: DraftAnswer[];
};

/* -----------------------------
   helpers
----------------------------- */

function validateTeam(team: Pick[]) {
  if (!Array.isArray(team)) {
    throw new Error("Team must be an array");
  }

  if (team.length !== 5) {
    throw new Error("Team must have exactly 5 picks");
  }

  const roles = team.map((p) => p.role);
  const unique = new Set(roles);

  if (unique.size !== 5) {
    throw new Error("Each role must appear exactly once");
  }
}

/* -----------------------------
   core logic
----------------------------- */

async function createDraft(input: CreateDraftInput) {
  const { role, userTeam, blue, red, answers } = input;

  validateTeam(blue);
  validateTeam(red);

  if (!Array.isArray(answers) || answers.length !== 3) {
    throw new Error("Exactly 3 answers are required");
  }

  const correctCount = answers.filter((a) => a.correct).length;
  if (correctCount !== 1) {
    throw new Error("Exactly one correct answer is required");
  }

  return prisma.draft.create({
    data: {
      role,
      userTeam,
      blue,   // ORDER PRESERVED
      red,    // ORDER PRESERVED
      answers,
      status: "PENDING",
    },
  });
}

/* -----------------------------
   HTTP HANDLER (THIS WAS MISSING)
----------------------------- */

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateDraftInput;
    const draft = await createDraft(body);
    return NextResponse.json(draft);
  } catch (err) {
    console.error("CREATE DRAFT ERROR", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
