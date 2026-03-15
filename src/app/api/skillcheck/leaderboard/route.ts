import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const MAX_ENTRIES = 100;

/** Average attempts per correct solve; null when no correct attempts. */
function avgAttempts(attempts: number, correctAttempts: number): number | null {
  if (correctAttempts <= 0) return null;
  return Math.round((attempts / correctAttempts) * 100) / 100;
}

/** GET: top streak entries; ?clientId=xxx returns myEntry for that client */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId")?.trim().slice(0, 64) || null;

  const [entries, myEntry] = await Promise.all([
    prisma.leaderboardEntry.findMany({
      where: { streakDays: { gt: 0 } },
      orderBy: { streakDays: "desc" },
      take: MAX_ENTRIES,
      select: {
        displayName: true,
        streakDays: true,
        updatedAt: true,
        draftAttempts: true,
        draftCorrectAttempts: true,
        runesAttempts: true,
        runesCorrectAttempts: true,
        cooldownsAttempts: true,
        cooldownsCorrectAttempts: true,
        itemsAttempts: true,
        itemsCorrectAttempts: true,
      },
    }),
    clientId
      ? prisma.leaderboardEntry
          .findUnique({
            where: { clientId },
            select: {
              displayName: true,
              streakDays: true,
              draftAttempts: true,
              draftCorrectAttempts: true,
              runesAttempts: true,
              runesCorrectAttempts: true,
              cooldownsAttempts: true,
              cooldownsCorrectAttempts: true,
              itemsAttempts: true,
              itemsCorrectAttempts: true,
            },
          })
          .then((e) =>
            e
              ? {
                  displayName: e.displayName ?? "Anonymous",
                  streakDays: e.streakDays,
                  avgDraft: avgAttempts(e.draftAttempts, e.draftCorrectAttempts),
                  avgRunes: avgAttempts(e.runesAttempts, e.runesCorrectAttempts),
                  avgCooldowns: avgAttempts(e.cooldownsAttempts, e.cooldownsCorrectAttempts),
                  avgItems: avgAttempts(e.itemsAttempts, e.itemsCorrectAttempts),
                }
              : null
          )
      : Promise.resolve(null),
  ]);

  return NextResponse.json({
    entries: entries.map((e) => ({
      displayName: e.displayName ?? "Anonymous",
      streakDays: e.streakDays,
      updatedAt: e.updatedAt.toISOString(),
      avgDraft: avgAttempts(e.draftAttempts, e.draftCorrectAttempts),
      avgRunes: avgAttempts(e.runesAttempts, e.runesCorrectAttempts),
      avgCooldowns: avgAttempts(e.cooldownsAttempts, e.cooldownsCorrectAttempts),
      avgItems: avgAttempts(e.itemsAttempts, e.itemsCorrectAttempts),
    })),
    myEntry,
  });
}

/** POST: submit or update streak (upsert by clientId) */
export async function POST(req: Request) {
  let body: { clientId?: string; displayName?: string; streakDays?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const clientId =
    typeof body.clientId === "string" && body.clientId.trim().length > 0
      ? body.clientId.trim().slice(0, 64)
      : null;
  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }

  const streakDays =
    typeof body.streakDays === "number" && body.streakDays >= 0
      ? Math.min(Math.floor(body.streakDays), 9999)
      : null;
  if (streakDays === null) {
    return NextResponse.json({ error: "streakDays required (0 or positive)" }, { status: 400 });
  }

  const displayName =
    body.displayName !== undefined
      ? (typeof body.displayName === "string"
          ? body.displayName.trim().slice(0, 32)
          : null)
      : undefined;

  const existing = await prisma.leaderboardEntry.findUnique({
    where: { clientId },
    select: { clientId: true },
  });

  await prisma.leaderboardEntry.upsert({
    where: { clientId },
    create: {
      clientId,
      streakDays,
      displayName: displayName ?? null,
    },
    update: {
      streakDays,
      ...(displayName !== undefined ? { displayName } : {}),
    },
  });

  return NextResponse.json({ ok: true, added: !existing });
}
