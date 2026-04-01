import "server-only";

import { createHmac } from "node:crypto";

import { prisma } from "@/lib/prisma";

const WEBHOOK_URL = process.env.DISCORD_BOT_WEBHOOK_URL?.trim() ?? "";
const WEBHOOK_SECRET = process.env.DISCORD_BOT_WEBHOOK_SECRET?.trim() ?? "";

export type SessionPaidWebhookPayload = {
  type: "session_paid";
  session: {
    id: string;
    status: string;
    sessionType: string;
    liveMinutes: number;
    followups: number;
    liveBlocks: number;
    riotTag: string;
    discordId: string | null;
    discordName: string | null;
    scheduledStart: string;
    scheduledMinutes: number;
    paymentRef: string | null;
    paymentProvider: string | null;
    amountCents: number | null;
    currency: string;
    studentId: string | null;
    student: {
      name: string;
      discordName: string | null;
      riotTag: string | null;
    } | null;
    slotId: string | null;
    slotStartISO: string | null;
  };
};

async function resolveSessionIdFromMeta(meta: Record<string, string>): Promise<string | null> {
  if (meta.bookingId) return meta.bookingId;
  if (meta.slotId) {
    const s = await prisma.session.findFirst({
      where: { slotId: meta.slotId },
      select: { id: true },
    });
    return s?.id ?? null;
  }
  const first = (meta.slotIds ?? "").split(",").filter(Boolean)[0];
  if (first) {
    const s = await prisma.session.findFirst({
      where: { slotId: first },
      select: { id: true },
    });
    return s?.id ?? null;
  }
  return null;
}

/**
 * POSTs to your Discord bot HTTP endpoint when a session is paid.
 * Set DISCORD_BOT_WEBHOOK_URL and DISCORD_BOT_WEBHOOK_SECRET (HMAC-SHA256 of raw JSON body, hex digest in X-Sho-Signature).
 * If unset, this is a no-op so production can roll out without the bot.
 */
export async function notifyDiscordBotSessionPaid(sessionId: string): Promise<void> {
  if (!WEBHOOK_URL) return;
  if (!WEBHOOK_SECRET) {
    console.warn("[discord-notify] DISCORD_BOT_WEBHOOK_URL is set but DISCORD_BOT_WEBHOOK_SECRET is missing");
    return;
  }

  const row = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      status: true,
      sessionType: true,
      liveMinutes: true,
      followups: true,
      liveBlocks: true,
      riotTag: true,
      discordId: true,
      discordName: true,
      scheduledStart: true,
      scheduledMinutes: true,
      paymentRef: true,
      paymentProvider: true,
      amountCents: true,
      currency: true,
      studentId: true,
      slotId: true,
      student: {
        select: { name: true, discordName: true, riotTag: true },
      },
      slot: { select: { startTime: true } },
    },
  });

  if (!row || row.status !== "paid") return;

  const payload: SessionPaidWebhookPayload = {
    type: "session_paid",
    session: {
      id: row.id,
      status: row.status,
      sessionType: row.sessionType,
      liveMinutes: row.liveMinutes,
      followups: row.followups,
      liveBlocks: row.liveBlocks,
      riotTag: row.riotTag,
      discordId: row.discordId,
      discordName: row.discordName,
      scheduledStart: row.scheduledStart.toISOString(),
      scheduledMinutes: row.scheduledMinutes,
      paymentRef: row.paymentRef,
      paymentProvider: row.paymentProvider,
      amountCents: row.amountCents,
      currency: row.currency,
      studentId: row.studentId,
      student: row.student,
      slotId: row.slotId,
      slotStartISO: row.slot?.startTime?.toISOString() ?? null,
    },
  };

  const body = JSON.stringify(payload);
  const signature = createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");

  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Sho-Signature": signature,
    },
    body,
    signal: AbortSignal.timeout(12_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`discord_bot_webhook ${res.status} ${detail.slice(0, 200)}`);
  }
}

/**
 * Resolves the session from Stripe metadata (same rules as finalizeBooking) and notifies the bot.
 * Safe to call after every successful payment webhook handle: if the session is not paid yet, it no-ops.
 */
export async function notifyDiscordBotSessionPaidFromMeta(meta: Record<string, string>): Promise<void> {
  if (!WEBHOOK_URL) return;
  const id = await resolveSessionIdFromMeta(meta);
  if (!id) return;
  await notifyDiscordBotSessionPaid(id);
}
