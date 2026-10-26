import { RequestLimitError } from "@/lib/security/requestLimitShared";
import { RiotRequestLimitError } from "@/lib/riot/fetch";
import type { LiveGameLookup } from "./types";
import { LOOKUP_FAILED_MESSAGE, RIOT_LIMIT_MESSAGE } from "./lookupMessages";

export function buildLookupError(error: unknown) {
  const limited = error instanceof RequestLimitError;
  const riotLimited = error instanceof RiotRequestLimitError && error.source === "upstream";
  const body: Extract<LiveGameLookup, { status: "error" }> = {
    status: "error",
    message: riotLimited ? RIOT_LIMIT_MESSAGE : limited
      ? "Lots of searches at once. Give it a minute, then try your game again."
      : LOOKUP_FAILED_MESSAGE,
    ...(limited ? { code: riotLimited ? "riot_rate_limit" as const : "rate_limit" as const, retryAfter: error.retryAfter } : {}),
  };
  return { body, status: limited ? 429 : 503 };
}
