import Stripe from "stripe";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CheckoutZ, computePriceEUR } from "../../../lib/pricing"; // ⬅ drop toCents
import { getBlockIds } from "../../../lib/booking/block";
import { rateLimit } from "../../../lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const HOLD_TTL_MIN = 10;
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "local";
  if (!rateLimit(`intent:${ip}`, 1000, 60_000)) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { 
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CheckoutZ.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }

  const { slotId, sessionType, liveMinutes, discord, inGame, followups, liveBlocks, holdKey } = parsed.data;

  try {
    const slot = await prisma.slot.findUnique({ where: { id: slotId } });
    if (!slot || slot.isTaken) {
      return NextResponse.json({ error: "Slot not found or already taken" }, { status: 409 });
    }
 // require valid hold & refresh TTL
 const now = new Date();
 if (slot.holdUntil && slot.holdUntil < now) {
   await prisma.slot.update({ where: { id: slotId }, data: { holdUntil: null, holdKey: null } });
   return NextResponse.json({ error: "hold_expired" }, { status: 409 });
 }
 if (slot.holdKey && holdKey && slot.holdKey !== holdKey) {
   return NextResponse.json({ error: "hold_mismatch" }, { status: 409 });
 }
 await prisma.slot.update({
   where: { id: slotId },
   data: { holdUntil: new Date(now.getTime() + HOLD_TTL_MIN * 60_000), ...(holdKey ? { holdKey } : {}) } as any,
 });
    const slotIds = await getBlockIds(slotId, liveMinutes, prisma);
    if (!slotIds?.length) {
      return NextResponse.json({ error: "Selected time isn’t fully available" }, { status: 409 });
    }

    // ✅ use both values
    const { amountCents, priceEUR } = computePriceEUR(liveMinutes, followups);

    const pi = await stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency: "eur",
        automatic_payment_methods: { enabled: true },
        metadata: {
          slotId,
          slotIds: slotIds.join(","),
          sessionType,
          liveMinutes: String(liveMinutes),
          discord: discord ?? "",
          inGame: String(!!inGame),
          followups: String(followups ?? 0),
          liveBlocks: String(liveBlocks ?? 0),
          priceEUR: String(priceEUR),
        },
      },
      { idempotencyKey: `${slotIds.join("|")}:${amountCents}` }
    );

    return NextResponse.json({ clientSecret: pi.client_secret });
  } catch (err: any) {
    console.error("INTENT_POST_ERROR:", err);
    return NextResponse.json({ error: "Failed to create intent", detail: String(err?.message || err) }, { status: 500 });
  }
}
