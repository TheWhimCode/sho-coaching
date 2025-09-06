import { NextResponse } from "next/server";
import Stripe from "stripe";
import { CFG_SERVER } from "@/lib/config.server";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

if (!CFG_SERVER.STRIPE_SECRET_KEY) throw new Error("Missing STRIPE_SECRET_KEY");

let stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (stripe) return stripe;
  stripe = new Stripe(CFG_SERVER.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
  });
  return stripe;
}

function piIdFromClientSecret(secret?: string | null): string | null {
  if (!secret) return null;
  const idx = secret.indexOf("_secret_");
  if (idx <= 0) return null;
  return secret.slice(0, idx);
}

type Body = {
  clientSecret?: string | null;
  piId?: string | null;
  email?: string | null;
  notes?: string | null;
  discord?: string | null;
  sessionType?: string | null; // ← bring this through
  liveMinutes?: number | null;
  liveBlocks?: number | null;
  followups?: number | null;
  waiverAccepted?: boolean | null;
};

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!rateLimit(`intent_update:${ip}`, 30, 60_000)) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    const body = (await req.json().catch(() => null)) as Body | null;
    if (!body) return NextResponse.json({ error: "invalid_json" }, { status: 400 });

    const piId = body.piId || piIdFromClientSecret(body.clientSecret || null);
    if (!piId) return NextResponse.json({ error: "missing_pi" }, { status: 400 });

    const pi = await getStripe().paymentIntents.retrieve(piId);
    if (!pi || (pi as any).object !== "payment_intent") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const current = (pi.metadata ?? {}) as Record<string, string>;
    const patch: Record<string, string> = {};

    if (typeof body.email === "string") patch.email = body.email.trim();
    if (typeof body.notes === "string") patch.notes = body.notes.trim();
    if (typeof body.discord === "string") patch.discord = body.discord.trim();
    if (typeof body.sessionType === "string") patch.sessionType = body.sessionType.trim();
    if (typeof body.liveMinutes === "number") patch.liveMinutes = String(body.liveMinutes);
    if (typeof body.liveBlocks === "number") patch.liveBlocks = String(body.liveBlocks);
    if (typeof body.followups === "number") patch.followups = String(body.followups);
    if (typeof body.waiverAccepted === "boolean") patch.waiverAccepted = String(body.waiverAccepted);

    // capture IP for waiver at confirm time
    if (typeof body.waiverAccepted === "boolean") {
      patch.waiverIp = ip;
    }

    const updateParams: Stripe.PaymentIntentUpdateParams = {
      metadata: { ...current, ...patch },
    };
    if (typeof body.email === "string" && body.email.trim()) {
      updateParams.receipt_email = body.email.trim();
    }

    await getStripe().paymentIntents.update(piId, updateParams);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("INTENT_UPDATE_ERROR", msg, err);
    return NextResponse.json({ error: "internal_error", detail: msg }, { status: 500 });
  }
}
