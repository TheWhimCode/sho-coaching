// src/app/api/patreon/webhook/route.ts
export const runtime = "nodejs"; // ensure Node runtime

import crypto from "node:crypto";
import { Client as Pg } from "pg";

const SECRET = process.env.PATREON_WEBHOOK_SECRET!;
const DIRECT_DATABASE_URL = process.env.DIRECT_DATABASE_URL!;

function timingEq(a: string, b: string) {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}

function verify(raw: Buffer, headerSig: string | null, secret: string) {
  if (!headerSig || !secret) return false;

  const sig = headerSig.trim();
  const hex = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const b64 = crypto.createHmac("sha256", secret).update(raw).digest("base64");

  // accept either hex or base64
  return timingEq(sig, hex) || timingEq(sig, b64);
}

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

export async function POST(req: Request) {
  try {
    const raw = Buffer.from(await req.arrayBuffer());
    const sig =
      req.headers.get("x-patreon-signature") ||
      req.headers.get("X-Patreon-Signature");

    if (!verify(raw, sig, SECRET)) {
      console.error("[patreon] signature failed", {
        hasSig: !!sig,
        sigLen: sig?.length,
        rawLen: raw.length,
      });
      return new Response("invalid signature", { status: 401 });
    }

    let payload: any;
    try {
      payload = JSON.parse(raw.toString("utf8"));
    } catch {
      return new Response("bad json", { status: 400 });
    }

    // Only handle publish events
    const evt = payload?.event_name || payload?.event_type;
    if (evt !== "posts:publish") return new Response("ignored", { status: 200 });

    const { postId, title, url } = extract(payload);

    const pg = new Pg({ connectionString: DIRECT_DATABASE_URL });
    await pg.connect();
    await pg.query("SELECT pg_notify('patreon_posts', $1)", [
      JSON.stringify({ postId, title, url }),
    ]);
    await pg.end();

    return new Response("ok");
  } catch (e) {
    console.error("[patreon webhook] error", e);
    return new Response("error", { status: 500 });
  }
}
