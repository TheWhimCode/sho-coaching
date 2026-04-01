import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { SlotStatus } from "@prisma/client";

import { getBlockIdsByTimeAdmin } from "@/engine/scheduling/startability/getBlockIdsByTimeAdmin";
import { notifyDiscordBotSessionRescheduled } from "@/lib/discord/sessionPaidWebhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  id: z.string(),                  // Session ID
  newStart: z.string().datetime(),  // ISO string (UTC)
  scheduledMinutes: z.number().int().positive().optional(),
});

export async function POST(req: Request) {
  try {
    const { id, newStart, scheduledMinutes } = Body.parse(await req.json());

    const newStartDate = new Date(newStart);

    // 1) Fetch current session (to get duration if not provided)
    const current = await prisma.session.findUnique({
      where: { id },
      select: { id: true, scheduledMinutes: true, scheduledStart: true },
    });

    if (!current) {
      return NextResponse.json(
        { error: "session_not_found" },
        { status: 404 }
      );
    }

    const dur = scheduledMinutes ?? current.scheduledMinutes ?? 60;

    // 2) Compute block IDs WITHOUT any scheduling restrictions (admin override)
    const blockIds = await getBlockIdsByTimeAdmin(
      newStartDate,
      dur,
      prisma
    );

    // 3) Always update the session time
    await prisma.session.update({
      where: { id },
      data: { scheduledStart: newStartDate },
      select: { id: true },
    });

    // 4) Block slots if any exist (forced)
    if (blockIds.length) {
      await prisma.slot.updateMany({
        where: { id: { in: blockIds } },
        data: { status: SlotStatus.blocked },
      });
    }

    const prevStart = current.scheduledStart.getTime();
    if (prevStart !== newStartDate.getTime()) {
      try {
        await notifyDiscordBotSessionRescheduled(id, current.scheduledStart);
      } catch (e) {
        console.error("[reschedule] discord session_rescheduled webhook failed", e);
      }
    }

    return NextResponse.json({
      ok: true,
      blockedSlots: blockIds.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 400 }
    );
  }
}
