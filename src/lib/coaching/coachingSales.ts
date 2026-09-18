import { NextResponse } from "next/server";

/**
 * Flip to `true` when coaching bookings should be sold again.
 * Kept as a hard flag so a pause is explicit in code, not an env default.
 */
export const COACHING_SALES_ENABLED = false;

/**
 * Elo Rush / multi-session bundles. Flip to `true` when ready to sell again.
 * Kept as a hard flag (not env) so temporary pause is explicit in code.
 */
export const RUSH_BUNDLE_ENABLED = false;

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

export function rushBundleBlockedResponse() {
  return NextResponse.json(
    {
      error: "bundle_unavailable",
      message: "Elo Rush bundles are temporarily unavailable.",
    },
    { status: 503 }
  );
}
