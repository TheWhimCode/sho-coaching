import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const MAX_ENTRIES = 100;

/** GET: top streak entries; ?clientId=xxx returns myEntry for that client */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId")?.trim().slice(0, 64) || null;

  const [entries, myEntry] = await Promise.all([
    prisma.leaderboardEntry.findMany({
      orderBy: { streakDays: "desc" },
      take: MAX_ENTRIES,
      select: {
        displayName: true,
        streakDays: true,
        updatedAt: true,
      },
    }),
    clientId
      ? prisma.leaderboardEntry
          .findUnique({
            where: { clientId },
            select: { displayName: true, streakDays: true },
          })
          .then((e) =>
            e
              ? {
                  displayName: e.displayName ?? "Anonymous",
                  streakDays: e.streakDays,
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
