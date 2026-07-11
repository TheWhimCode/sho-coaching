import { NextResponse } from "next/server";
import { fetchTwitchStreamStatus } from "@/lib/twitch/fetchTwitchStreamStatus";

export const revalidate = 60;

export async function GET() {
  const status = await fetchTwitchStreamStatus();

  return NextResponse.json(status, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
