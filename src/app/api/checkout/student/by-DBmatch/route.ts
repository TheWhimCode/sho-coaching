import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (!rateLimit(`student:by-DBmatch:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const url = new URL(req.url);
  const puuid = url.searchParams.get("puuid")?.trim() || "";
  const discordId = url.searchParams.get("discordId")?.trim() || "";

  if (!puuid && !discordId) {
    return NextResponse.json(
      { error: "missing_identifier" },
      { status: 400 }
    );
  }

  try {
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          puuid ? { puuid } : undefined,
          discordId ? { discordId } : undefined,
        ].filter(Boolean) as any,
      },
      select: {
        id: true,
        puuid: true,
        discordId: true,
        discordName: true,
        riotTag: true,
        name: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({
      studentId: student.id,
      puuid: student.puuid ?? null,
      discordId: student.discordId ?? null,
      discordName: student.discordName ?? null,
      riotTag: student.riotTag ?? null,
      displayName: student.discordName ?? student.name ?? null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[student/by-DBmatch] error:", msg);

    return NextResponse.json(
      { error: "internal_error", detail: msg },
      { status: 500 }
    );
  }
}
