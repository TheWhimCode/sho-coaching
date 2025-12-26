// app/skillcheck/draft/loader.ts
import { prisma } from "@/lib/prisma";

type Pick = {
  role: "top" | "jng" | "mid" | "adc" | "sup";
  champ: string | null;
};

export type DraftAnswer = {
  champ: string;
  explanation: string;
  correct?: true;
};

export type DraftData = {
  id: string;
  blue: Pick[];
  red: Pick[];
  role: Pick["role"];
  userTeam: "blue" | "red";
  answers: DraftAnswer[];
};

export async function getDraft(): Promise<DraftData> {
  const draft = await prisma.draft.findFirst({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
  });

  if (!draft) {
    throw new Error("No draft found");
  }

  return {
    id: draft.id,
    blue: draft.blue as Pick[],
    red: draft.red as Pick[],
    role: draft.role as DraftData["role"],
    userTeam: draft.userTeam as "blue" | "red",
    answers: draft.answers as DraftAnswer[],
  };
}
