// src/app/api/patreon/webhook/route.ts
export const runtime = "nodejs"; // ensure Node runtime (not Edge)

import crypto from "node:crypto";
import { Client as Pg } from "pg";

const SECRET = process.env.PATREON_WEBHOOK_SECRET!;
const DIRECT_DATABASE_URL = process.env.DIRECT_DATABASE_URL!;

function verify(raw: Buffer, headerSig: string | null) {
  if (!SECRET || !headerSig) return false;
  const mac = crypto.createHmac("sha256", SECRET).update(raw).digest("hex");
  const a = Buffer.from(mac, "hex");
  const b = Buffer.from(headerSig, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function extract(p: any) {
  const a = p?.data?.attributes ?? {};
  const id = p?.data?.id;
  const url =
    a.url ??
    (a.slug ? `https://www.patreon.com/posts/${a.slug}` : id ? `https://www.patreon.com/posts/${id}` : undefined);
  const title = a.title ?? (id ? `New Patreon Post #${id}` : "New Patreon Post");
  return { postId: id, title, url };
}

export async function POST(req: Request) {
  try {
    const sig = req.headers.get("x-patreon-signature");
    const raw = Buffer.from(await req.arrayBuffer());

    if (!verify(raw, sig)) {
      return new Response("invalid signature", { status: 401 });
    }

    const payload = JSON.parse(raw.toString("utf8"));

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
