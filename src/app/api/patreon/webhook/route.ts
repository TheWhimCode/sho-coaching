// src/app/api/patreon/webhook/route.ts
export const runtime = "nodejs"; // ensure Node runtime

import crypto from "node:crypto";
import { Client as Pg } from "pg";

const SECRET = process.env.PATREON_WEBHOOK_SECRET!;
const DIRECT_DATABASE_URL = process.env.DIRECT_DATABASE_URL!;
const DEBUG = process.env.DEBUG_PATREON === "1";

// --- small in-memory dedupe (per instance) ---
const SEEN_TTL_MS = 10 * 60 * 1000; // 10 minutes
const seen = new Map<string, number>();
function dedupe(key?: string) {
  const now = Date.now();
  for (const [k, t] of seen) if (now - t > SEEN_TTL_MS) seen.delete(k);
  if (!key) return false;
  const prev = seen.get(key);
  seen.set(key, now);
  return !!prev && now - (prev ?? 0) < SEEN_TTL_MS;
}

// --- crypto helpers ---
function timingEq(a: string, b: string) {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}

// Patreon: HMAC-MD5 hex over the *raw* body with your webhook secret
function verify(raw: Buffer, headerSig: string | null, secret: string) {
  if (!headerSig || !secret) return false;
  const sig = headerSig.trim();
  const hex = crypto.createHmac("md5", secret).update(raw).digest("hex");
  return timingEq(sig, hex);
}

// pull a few useful fields
function extract(p: any) {
  const a = p?.data?.attributes ?? {};
  const id = p?.data?.id;
  const url =
    a.url ??
    (a.slug
      ? `https://www.patreon.com/posts/${a.slug}`
      : id
      ? `https://www.patreon.com/posts/${id}`
      : undefined);
  const title = a.title ?? (id ? `New Patreon Post #${id}` : "New Patreon Post");
  return { postId: id, title, url };
}

// Promise timeout helper
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

export async function POST(req: Request) {
  try {
    const raw = Buffer.from(await req.arrayBuffer());
    const sig = req.headers.get("x-patreon-signature") || req.headers.get("X-Patreon-Signature");
    const hdrEvt = req.headers.get("x-patreon-event") || req.headers.get("X-Patreon-Event") || null;

    if (DEBUG) {
      // minimal header snapshot (no auth secrets printed)
      const h = Object.fromEntries(
        Array.from(req.headers.entries())
          .filter(([k]) => ["content-type", "x-patreon-signature", "x-patreon-event", "user-agent"].includes(k.toLowerCase()))
      );
      console.log("[patreon] hit", { hdrEvt, sigLen: (sig ?? "").length, rawLen: raw.length, headers: h });
    }

    // Keep 401 on bad signature (signals misconfig), but everything else returns 200.
    if (!verify(raw, sig, SECRET)) {
      console.error("[patreon] signature failed", { hasSig: !!sig, sigLen: sig?.length, rawLen: raw.length });
      return new Response("invalid signature", { status: 401 });
    }

    let payload: any;
    try {
      payload = JSON.parse(raw.toString("utf8"));
    } catch {
      console.error("[patreon] bad json");
      return new Response("ignored", { status: 200 });
    }

    const evt = payload?.event_name || payload?.event_type || hdrEvt || null;
    if (DEBUG) console.log("[patreon] evt", evt, "payload.keys", Object.keys(payload || {}));

    if (evt !== "posts:publish") {
      if (DEBUG) console.log("[patreon] non-target event ignored");
      return new Response("ignored", { status: 200 });
    }

    const { postId, title, url } = extract(payload);
    if (DEBUG) console.log("[patreon] extracted", { postId, title, url });

    if (dedupe(postId)) {
      if (DEBUG) console.info("[patreon] duplicate event suppressed", { postId });
      return new Response("ok");
    }

    // Best-effort DB notify with timeout; always ACK 200
    (async () => {
      try {
        const pg = new Pg({ connectionString: DIRECT_DATABASE_URL, ssl: { rejectUnauthorized: false } as any });
        await withTimeout(pg.connect(), 5000);
        await withTimeout(
          pg.query("SELECT pg_notify('patreon_posts', $1)", [JSON.stringify({ postId, title, url })]),
          5000
        );
        await pg.end();
        if (DEBUG) console.log("[patreon] notified db");
      } catch (dbErr) {
        console.error("[patreon webhook] db error", dbErr);
      }
    })().catch(() => { /* already logged */ });

    return new Response("ok");
  } catch (e) {
    console.error("[patreon webhook] unhandled error", e);
    return new Response("ok");
  }
}

// Optional: health checks
export async function GET() {
  return new Response("ok");
}
export async function HEAD() {
  return new Response(null, { status: 200 });
}
