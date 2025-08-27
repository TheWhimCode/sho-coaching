import { NextRequest, NextResponse } from "next/server";

export function GET(req: NextRequest) {
  const country =
    req.headers.get("x-vercel-ip-country") || // Vercel
    req.headers.get("cf-ipcountry") ||        // Cloudflare
    "ZZ";

  return NextResponse.json({ country });
}
