import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import type { Prisma } from "@prisma/client";
import { SlotStatus } from "@prisma/client";

/**
 * Notes:
 * - Uses your actual schema: Slot.duration + Slot.status + Session fields.
 * - Does NOT use holds.
 * - Does NOT write preset/productId (they do not exist on Session in your schema).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ----------------------- validation ----------------------- */

const PostZ = z.object({
  slotId: z.string().min(1).max(64),

  sessionType: z.string().min(1),
  liveMinutes: z.number().int().min(30).max(240),
  followups: z.number().int().min(0).max(20).optional(),
  liveBlocks: z.number().int().min(0).max(20).optional(),

  riotTag: z.string().min(1),
  discordId: z.string().min(1).nullable().optional(),
  discordName: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

/* ----------------------- helpers ----------------------- */

function noStore(json: unknown, status = 200) {
  const res = NextResponse.json(json, { status });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

function getIP(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function isP2002(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as any).code === "P2002";
}

async function resolveCanonicalStudent(
  tx: Prisma.TransactionClient,
  args: { discordId?: string | null; discordName?: string | null; riotTag: string }
) {
  const { discordId, discordName, riotTag } = args;

  let student =
    (discordId ? await tx.student.findUnique({ where: { discordId } }) : null) ??
    (await tx.student.findUnique({ where: { riotTag } }));

  if (!student) {
    const baseName = riotTag ? riotTag.split("#")[0] : "Student";
    let name = baseName;

    for (let i = 0; i < 5; i++) {
      try {
        student = await tx.student.create({
          data: {
            name,
            riotTag: riotTag || null,
            discordId: discordId ?? null,
            discordName: discordName ?? null,
          },
        });
        break;
      } catch (e) {
        if (isP2002(e)) {
          name = `${baseName}-${Math.floor(Math.random() * 1000)}`;
          continue;
        }
        throw e;
      }
    }
    if (!student) throw new Error("failed_to_create_student");
  }

  if (discordId && discordId !== student.discordId) {
    try {
      student = await tx.student.update({ where: { id: student.id }, data: { discordId } });
    } catch (e) {
      if (!isP2002(e)) throw e;
      const conflict = await tx.student.findUnique({ where: { discordId } });
      if (conflict && conflict.id !== student.id) {
        await tx.student.update({ where: { id: conflict.id }, data: { discordId: null } });
      }
      student = await tx.student.update({ where: { id: student.id }, data: { discordId } });
    }
  }

  if (discordName && discordName !== student.discordName) {
    student = await tx.student.update({ where: { id: student.id }, data: { discordName } });
  }

  if (riotTag && riotTag !== student.riotTag) {
    try {
      student = await tx.student.update({ where: { id: student.id }, data: { riotTag } });
    } catch (e) {
      if (!isP2002(e)) throw e;
      const conflict = await tx.student.findUnique({ where: { riotTag } });
      if (conflict && conflict.id !== student.id) {
        await tx.student.update({ where: { id: conflict.id }, data: { riotTag: null } });
      }
      student = await tx.student.update({ where: { id: student.id }, data: { riotTag } });
    }
  }

  return student;
}

/* ----------------------- POST ----------------------- */

export async function POST(req: Request) {
  const ip = getIP(req);
  if (!rateLimit(`quickbook:create:${ip}`, 30, 60_000)) {
    return noStore({ error: "rate_limited" }, 429);
  }

  let body: z.infer<typeof PostZ>;
  try {
    body = PostZ.parse(await req.json());
  } catch {
    return noStore({ error: "bad_request" }, 400);
  }

  const {
    slotId,
    sessionType,
    liveMinutes,
    riotTag,
    discordId,
    discordName,
    notes,
  } = body;

  const followups = body.followups ?? 0;
  const liveBlocks = body.liveBlocks ?? 0;

  const totalMinutes = liveMinutes + liveBlocks * 45;

  try {
    const out = await prisma.$transaction(async (tx) => {
      // 1) load the selected start slot
      const startSlot = await tx.slot.findUnique({
        where: { id: slotId },
        select: { id: true, startTime: true, duration: true, status: true },
      });

      if (!startSlot) return { ok: false as const, status: 404, error: "slot_not_found" };

      if (startSlot.status !== SlotStatus.free) {
        return { ok: false as const, status: 409, error: "unavailable" };
      }

      const stepMin = startSlot.duration; // your DB says each slot has duration
      if (!stepMin || stepMin <= 0) {
        return { ok: false as const, status: 500, error: "slot_duration_invalid" };
      }

      if (totalMinutes % stepMin !== 0) {
        return {
          ok: false as const,
          status: 400,
          error: `duration_mismatch_total_${totalMinutes}_step_${stepMin}`,
        };
      }

      const needed = totalMinutes / stepMin;

      const startTime = startSlot.startTime;
      const endTime = new Date(startTime.getTime() + totalMinutes * 60_000);

      // 2) fetch all slots inside the window
      const windowSlots = await tx.slot.findMany({
        where: { startTime: { gte: startTime, lt: endTime } },
        orderBy: { startTime: "asc" },
        select: { id: true, startTime: true, status: true },
      });

      if (windowSlots.length !== needed) {
        return { ok: false as const, status: 409, error: "window_missing_slots" };
      }

      // 3) verify contiguity + free
      for (let i = 0; i < windowSlots.length; i++) {
        const s = windowSlots[i];
        if (s.status !== SlotStatus.free) {
          return { ok: false as const, status: 409, error: "unavailable" };
        }
        if (i > 0) {
          const prev = windowSlots[i - 1].startTime.getTime();
          const cur = s.startTime.getTime();
          if (cur - prev !== stepMin * 60_000) {
            return { ok: false as const, status: 409, error: "not_contiguous" };
          }
        }
      }

      const slotIds = windowSlots.map((s) => s.id);
      const firstSlotId = slotIds[0];

      // 4) atomically claim: only free rows become taken
      const claim = await tx.slot.updateMany({
        where: { id: { in: slotIds }, status: SlotStatus.free },
        data: {
          status: SlotStatus.taken,
          holdKey: null,
          holdUntil: null,
        },
      });

      if (claim.count !== slotIds.length) {
        return { ok: false as const, status: 409, error: "unavailable" };
      }

      // 5) student
      const student = await resolveCanonicalStudent(tx, {
        discordId: discordId ?? null,
        discordName: discordName ?? null,
        riotTag,
      });

// 6) Create Session as UNPAID (so your notifier that watches unpaid -> paid will fire)
const unpaid = await tx.session.create({
  data: {
    studentId: student.id,

    sessionType,
    status: "unpaid",

    slotId: firstSlotId,
    blockCsv: slotIds.join(","),

    liveMinutes,
    followups,
    liveBlocks,

    riotTag,
    notes: notes?.trim() ? notes.trim() : null,
    discordId: discordId ?? null,
    discordName: discordName ?? null,

    scheduledStart: startTime,
    scheduledMinutes: liveMinutes,

    // keep pricing fields present if your system expects them
    currency: "eur",
    amountCents: 0,
  },
  select: { id: true, status: true },
});

// 7) Immediately UPDATE to PAID (this is what should fire your DB trigger)
const paymentRef = `quickbook:${Date.now()}:${Math.random().toString(16).slice(2)}`;

const session = await tx.session.update({
  where: { id: unpaid.id },
  data: {
    status: "paid",
    paymentProvider: "quickbook",
    paymentRef,
    // keep these if you want them guaranteed on the paid row
    amountCents: 0,
    currency: "eur",
  },
  select: { id: true },
});

      // 7) ensure sessionDoc exists (like finalizeBooking)
      const exists = await tx.sessionDoc.findFirst({
        where: { sessionId: session.id },
        select: { id: true },
      });

      if (!exists) {
        const last = await tx.sessionDoc.findFirst({
          where: { studentId: student.id },
          orderBy: { number: "desc" },
          select: { number: true },
        });

        const nextNumber = (last?.number ?? 0) + 1;

        await tx.sessionDoc.create({
          data: {
            studentId: student.id,
            sessionId: session.id,
            number: nextNumber,
            notes: { title: sessionType, md: "" },
          },
        });
      }

      return { ok: true as const, sessionId: session.id };
    });

    if (!out.ok) {
      return noStore({ error: out.error }, out.status);
    }

    // Keep naming consistent with your client (bookingId)
    return noStore({ bookingId: out.sessionId }, 200);
  } catch (e) {
    console.error("QUICKBOOK_CREATE_AND_FINALIZE_ERROR", e);
    return noStore({ error: "internal_error" }, 500);
  }
}