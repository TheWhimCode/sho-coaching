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

function validateTeam(team: Pick[]) {
  if (!Array.isArray(team)) {
    throw new Error("Team must be an array");
  }
  if (team.length !== 5) {
    throw new Error("Team must have exactly 5 picks");
  }

  const roles = team.map((p) => p.role);
  if (new Set(roles).size !== 5) {
    throw new Error("Each role must appear exactly once");
  }
}

function extractAllChamps(blue: Pick[], red: Pick[]) {
  return [...blue, ...red]
    .map((p) => p.champ)
    .filter(Boolean) as string[];
}

async function createDraftAdmin(input: CreateDraftInput) {
  const { role, userTeam, blue, red, answers } = input;

  validateTeam(blue);
  validateTeam(red);

  if (!Array.isArray(answers) || answers.length !== 1) {
    throw new Error("Exactly 1 answer is required");
  }

  if (answers.filter((a) => a.correct).length !== 1) {
    throw new Error("Exactly one correct answer is required");
  }

  const solutionTeam = userTeam === "blue" ? blue : red;

  const solutionSlot = solutionTeam.find((p) => p.role === role);

  if (!solutionSlot) {
    throw new Error("Solution slot not found");
  }

  if (!solutionSlot.champ) {
    throw new Error("Solution slot must contain a champion");
  }

  const allChamps = extractAllChamps(blue, red);

  if (new Set(allChamps).size !== allChamps.length) {
    throw new Error("Duplicate champions are not allowed");
  }

  const redactSolution = (team: Pick[]) =>
    team.map((p) => (p.role === role ? { ...p, champ: null } : p));

  const safeBlue = userTeam === "blue" ? redactSolution(blue) : blue;

  const safeRed = userTeam === "red" ? redactSolution(red) : red;

  return prisma.draft.create({
    data: {
      submitIp: null,
      role,
      userTeam,
      blue: safeBlue,
      red: safeRed,
      answers,
      status: "PENDING",
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateDraftInput;
    const draft = await createDraftAdmin(body);
    return NextResponse.json(draft);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}

