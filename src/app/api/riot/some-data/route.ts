// src/app/api/league/some-data/route.ts
import { NextResponse } from "next/server";
import { riotFetchJSON } from "@/lib/riot/fetch";

export const revalidate = 600; // 10 min CDN cache on Next

export async function GET() {
  const data = await riotFetchJSON<any>("https://<region>.api.riotgames.com/...");

  return NextResponse.json(data, {
    headers: {
      // CDN/browser caching
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400",
    },
  });
}
