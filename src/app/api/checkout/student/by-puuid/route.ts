import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`student:by-puuid:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const url = new URL(req.url);
  const puuid = url.searchParams.get("puuid")?.trim() || "";
  if (!puuid) return NextResponse.json({ error: "missing_puuid" }, { status: 400 });

  try {
    const s = await prisma.student.findUnique({
      where: { puuid },
      select: { id: true, discordId: true, discordName: true, riotTag: true, name: true },
    });

    if (!s) return NextResponse.json({ error: "not_found" }, { status: 404 });

    return NextResponse.json({
      studentId: s.id,
      discordId: s.discordId ?? null,
      discordName: s.discordName ?? null,
      riotTag: s.riotTag ?? null,
      displayName: s.discordName ?? s.name ?? null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[student/by-puuid] error:", msg);
    return NextResponse.json({ error: "internal_error", detail: msg }, { status: 500 });
  }
}
