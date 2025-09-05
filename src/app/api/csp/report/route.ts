import { NextResponse } from "next/server";

export const runtime = "nodejs";
export async function POST(req: Request) {
  // Accept any payload; don't crash on junk
  const body = await req.json().catch(() => ({}));
  // Send to your logger in real life; console is fine to start
  console.log("CSP report:", JSON.stringify(body));
  return NextResponse.json({ ok: true });
}
