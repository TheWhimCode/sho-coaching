import { NextResponse } from "next/server";

/** Set `NEXT_PUBLIC_COACHING_SALES_ENABLED=true` to re-enable purchases. */
export const COACHING_SALES_ENABLED =
  process.env.NEXT_PUBLIC_COACHING_SALES_ENABLED === "true";

export const COACHING_DISCORD_URL = "https://discord.gg/HfvxZBp";

export function coachingSalesBlockedResponse() {
  return NextResponse.json(
    {
      error: "coaching_unavailable",
      message: "Coaching purchases are temporarily unavailable.",
    },
    { status: 503 }
  );
}
