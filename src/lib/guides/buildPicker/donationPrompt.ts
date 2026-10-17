const LOOKUP_COUNT_KEY = "viego-build-successful-lookups-v1";
const SEEN_KEY = "viego-build-donation-prompt-seen-v1";
const LOOKUP_THRESHOLD = 20;
export const DONATION_LOOKUP_EVENT = "viego-build-lookup-completed";

type PromptStorage = Pick<Storage, "getItem" | "setItem">;

function lookupCount(storage: PromptStorage) {
  const count = Number(storage.getItem(LOOKUP_COUNT_KEY));
  return Number.isSafeInteger(count) && count >= 0 ? count : 0;
}

export function recordBuildLookup(storage: PromptStorage) {
  const count = Math.min(lookupCount(storage) + 1, LOOKUP_THRESHOLD);
  storage.setItem(LOOKUP_COUNT_KEY, String(count));
}

/** Claim the one-time prompt before displaying it, including across page reloads. */
export function claimDonationPrompt(storage: PromptStorage) {
  if (storage.getItem(SEEN_KEY) || lookupCount(storage) < LOOKUP_THRESHOLD) return false;
  storage.setItem(SEEN_KEY, "1");
  return true;
}
