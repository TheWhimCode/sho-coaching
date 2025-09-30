import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`checkout:attach-name:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid_json" }, { status: 400 });

  const bookingId = (body.bookingId ?? "").toString().trim(); // optional
  const discordId = (body.discordId ?? "").toString().trim(); // required
  const discordName = body.discordName == null ? null : String(body.discordName);

  if (!discordId) {
    return NextResponse.json({ error: "missing_discordId" }, { status: 400 });
  }

  try {
    // If a booking is provided, update the Session first
    if (bookingId) {
      const sess = await prisma.session.update({
        where: { id: bookingId },
        data: {
          discordId,
          discordName,
        },
        select: { id: true, studentId: true },
      });

      // If already linked to a student, keep Student in sync
      if (sess.studentId) {
        await prisma.student.update({
          where: { id: sess.studentId },
          data: {
            discordId,
            ...(discordName ? { discordName } : {}),
          },
        });
      } else {
        // If there is an existing Student by discordId, link the Session to it and sync name
        const existing = await prisma.student.findUnique({
          where: { discordId },
          select: { id: true },
        });
        if (existing?.id) {
          await prisma.session.update({
            where: { id: sess.id },
            data: { studentId: existing.id },
          });
          if (discordName) {
            await prisma.student.update({
              where: { id: existing.id },
              data: { discordName },
            });
          }
        }
      }
    } else {
      // No booking yet: If a Student exists with this discordId, update the display name
      const existing = await prisma.student.findUnique({
        where: { discordId },
        select: { id: true },
      });
      if (existing?.id && discordName) {
        await prisma.student.update({
          where: { id: existing.id },
          data: { discordName },
        });
      }
      // If there is no Student, we do nothing here (we avoid creating a Student prematurely)
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[checkout/discord/attach-name] error", msg);
    return NextResponse.json({ error: "internal_error", detail: msg }, { status: 500 });
  }
}
