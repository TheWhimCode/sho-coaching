// src/app/api/patreon/webhook/route.ts
export const runtime = "nodejs";

import crypto from "node:crypto";
import { Client as Pg } from "pg";

const SECRET = process.env.PATREON_WEBHOOK_SECRET!;
const DIRECT = process.env.DIRECT_DATABASE_URL!;
const POOLED = process.env.DATABASE_URL; // pooled (recommended for webhook)
const DB_URL = POOLED ?? DIRECT;         // use pooled if available

const DEBUG = process.env.DEBUG_PATREON === "1";

// --------- verify helpers ----------
function timingEq(a: string, b: string) {
  const A = Buffer.from(a); const B = Buffer.from(b);
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}
function verify(raw: Buffer, sigHeader: string | null, secret: string) {
  if (!sigHeader || !secret) return false;
  const want = crypto.createHmac("md5", secret).update(raw).digest("hex");
  return timingEq(sigHeader.trim(), want);
}
// extract fields
function extract(p: any) {
  const a = p?.data?.attributes ?? {};
  const id = p?.data?.id;
  const url =
    a.url ??
    (a.slug ? `/posts/${a.slug}` : id ? `/posts/${id}` : undefined);
  const title = a.title ?? (id ? `New Patreon Post #${id}` : "New Patreon Post");
  return { postId: id, title, url };
}

// --------- PG singleton ----------
type PgState = { client: Pg | null, connecting: Promise<void> | null };
const g = globalThis as any;
g.__patreonPg ??= { client: null, connecting: null } as PgState;
const state: PgState = g.__patreonPg;

async function ensurePgConnected() {
  if (state.client) return;
  const pg = new Pg({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } as any });
  const p = pg.connect();
  state.connecting = p;
  await Promise.race([
    p,
    new Promise<void>((_, rej) => setTimeout(() => rej(new Error("pg connect timeout")), 8000)),
  ]);
  state.client = pg;
  state.connecting = null;
  if (DEBUG) {
    const u = new URL(DB_URL);
    console.log("[patreon] PG connected", u.host, u.pathname, POOLED ? "(pooled)" : "(direct)");
  }
}

export async function POST(req: Request) {
  try {
    const raw = Buffer.from(await req.arrayBuffer());
    const sig = req.headers.get("x-patreon-signature") || req.headers.get("X-Patreon-Signature");
// TEMPORARY for testing:
if (process.env.NODE_ENV === "production" && !verify(raw, sig, SECRET)) {
  return new Response("invalid signature", { status: 401 });
}

    let payload: any;
    try { payload = JSON.parse(raw.toString("utf8")); } catch { return new Response("ignored", { status: 200 }); }

    const evt = payload?.event_name || payload?.event_type || null;
    if (evt !== "posts:publish") return new Response("ignored", { status: 200 });

    const { postId, title, url } = extract(payload);
    const fullUrl = url?.startsWith("http") ? url : (url ? `https://www.patreon.com${url}` : undefined);
    if (DEBUG) console.log("[patreon] extracted", { postId, title, url: fullUrl });

    // connect once, then reuse
    try {
      if (state.connecting) await state.connecting;
      if (!state.client) await ensurePgConnected();

      await Promise.race([
        state.client!.query("SELECT pg_notify('patreon_posts', $1)", [
          JSON.stringify({ postId, title, url: fullUrl }),
        ]),
        new Promise<void>((_, rej) => setTimeout(() => rej(new Error("pg query timeout")), 5000)),
      ]);

      if (DEBUG) console.log("[patreon] notified db");
    } catch (e) {
      console.error("[patreon webhook] db error", e);
      // keep ack to avoid Patreon retries
    }

    return new Response("ok");
  } catch (e) {
    console.error("[patreon webhook] unhandled", e);
    return new Response("ok");
  }
}

export async function GET() { return new Response("ok"); }
export async function HEAD() { return new Response(null, { status: 200 }); }
