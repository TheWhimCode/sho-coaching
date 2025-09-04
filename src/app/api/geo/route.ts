// src/app/api/geo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "edge"; // edge is fine here
export const dynamic = "force-dynamic";

function noStore(json: any, status = 200) {
  const res = NextResponse.json(json, { status });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function GET(req: NextRequest) {
  // derive IP/fallback
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";

  if (!rateLimit(`geo:${ip}`, 60, 60_000)) {
    return noStore({ error: "rate_limited" }, 429);
  }

  const country =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    "ZZ";

  return noStore({ country });
}
