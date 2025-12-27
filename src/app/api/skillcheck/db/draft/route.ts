import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";

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
  if (new Set(roles).size !== 5) {
    throw new Error("Each role must appear exactly once");
  }
}

function getSubmitIp(req: Request) {
  const rawIp =
    req.headers.get("x-forwarded-for")?.split(",")[0] ??
    req.headers.get("x-real-ip") ??
    "unknown";

  return crypto
    .createHash("sha256")
    .update(rawIp)
    .digest("hex");
}

function extractAllChamps(blue: Pick[], red: Pick[]) {
  return [...blue, ...red]
    .map((p) => p.champ)
    .filter(Boolean) as string[];
}

/* -----------------------------
   core logic
----------------------------- */

async function createDraft(
  input: CreateDraftInput,
  submitIp: string
) {
  const { role, userTeam, blue, red, answers } = input;

  validateTeam(blue);
  validateTeam(red);

  /* -----------------------------
     answers validation
     (NEW: exactly ONE answer)
  ----------------------------- */

  if (!Array.isArray(answers) || answers.length !== 1) {
    throw new Error("Exactly 1 answer is required");
  }

  if (answers.filter((a) => a.correct).length !== 1) {
    throw new Error("Exactly one correct answer is required");
  }

  /* -----------------------------
     solution slot validation
     (implicit, matches current schema)
  ----------------------------- */

  const solutionTeam = userTeam === "blue" ? blue : red;

  const solutionSlot = solutionTeam.find(
    (p) => p.role === role
  );

  if (!solutionSlot) {
    throw new Error("Solution slot not found");
  }

  if (!solutionSlot.champ) {
    throw new Error(
      "Solution slot must contain a champion"
    );
  }

  /* -----------------------------
     no duplicate champions
  ----------------------------- */

  const allChamps = extractAllChamps(blue, red);

  if (new Set(allChamps).size !== allChamps.length) {
    throw new Error("Duplicate champions are not allowed");
  }

  /* -----------------------------
     rate limit (1 / day)
  ----------------------------- */

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const existing = await prisma.draft.findFirst({
    where: {
      submitIp,
      createdAt: { gte: startOfDay },
    },
  });

  if (existing) {
    throw new Error("You can only submit one draft per day");
  }

  /* -----------------------------
     persist (matches schema)
  ----------------------------- */

  return prisma.draft.create({
    data: {
      submitIp,
      role,
      userTeam,
      blue,
      red,
      answers,
      status: "PENDING",
    },
  });
}

/* -----------------------------
   HTTP HANDLER
----------------------------- */

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateDraftInput;
    const submitIp = getSubmitIp(req);

    const draft = await createDraft(body, submitIp);
    return NextResponse.json(draft);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
