// app/skillcheck/draft/page.tsx
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import DraftClient from "./DraftClient";

type Pick = {
  role: "top" | "jng" | "mid" | "adc" | "sup";
  champ: string | null;
};

type DraftAnswer = {
  champ: string;
  explanation: string;
  correct?: true;
};

type DraftType = {
  id: string;
  blue: Pick[];
  red: Pick[];
  role: Pick["role"];
  userTeam: "blue" | "red";
  answers: DraftAnswer[];
};

export default async function DraftPage() {
  const raw = await prisma.draft.findFirst({
    where: { status: "APPROVED" },
    orderBy: { usedLast: "desc" }, // today’s draft
  });

  if (!raw) return null;

  const avgAttempts =
    raw.correctAttempts > 0
      ? (raw.attempts / raw.correctAttempts).toFixed(2)
      : "–";

  const draft: DraftType = {
    id: raw.id,
    blue: raw.blue as Pick[],
    red: raw.red as Pick[],
    role: raw.role as DraftType["role"],
    userTeam: raw.userTeam as "blue" | "red",
    answers: raw.answers as DraftAnswer[],
  };

  return <DraftClient draft={draft} avgAttempts={avgAttempts} />;
}
