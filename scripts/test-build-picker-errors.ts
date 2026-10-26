import assert from "node:assert/strict";
import { buildLookupError } from "../src/lib/guides/buildPicker/lookupError";
import { RIOT_LIMIT_MESSAGE, LOOKUP_FAILED_MESSAGE } from "../src/lib/guides/buildPicker/lookupMessages";
import { RequestLimitError } from "../src/lib/security/requestLimitShared";
import { RiotRequestLimitError, RiotApiError } from "../src/lib/riot/fetch";

const riotLimit = buildLookupError(new RiotRequestLimitError(75));
assert.equal(riotLimit.status, 429);
assert.equal(riotLimit.body.code, "riot_rate_limit");
assert.equal(riotLimit.body.retryAfter, 75);
assert.equal(riotLimit.body.message, RIOT_LIMIT_MESSAGE);

const visitorLimit = buildLookupError(new RequestLimitError(30));
const outboundSafetyLimit = buildLookupError(new RiotRequestLimitError(45, "safety_cap"));
assert.equal(outboundSafetyLimit.status, 429);
assert.equal(outboundSafetyLimit.body.code, "rate_limit");
assert.equal(outboundSafetyLimit.body.retryAfter, 45);
assert.ok(!outboundSafetyLimit.body.message.includes("Riot"), "Our outbound safety cap must not be presented as a Riot rejection");
assert.equal(visitorLimit.status, 429);
assert.equal(visitorLimit.body.code, "rate_limit");
assert.equal(visitorLimit.body.retryAfter, 30);
assert.ok(!visitorLimit.body.message.includes("Riot"), "Local throttling must not blame Riot");

for (const error of [new Error("private upstream details"), new RiotApiError(403, "https://asia.api.riotgames.com/riot/account/v1/accounts", "Forbidden")]) {
  const result = buildLookupError(error);
  assert.equal(result.status, 503);
  assert.equal(result.body.message, LOOKUP_FAILED_MESSAGE);
  assert.equal(result.body.code, undefined, "403 and generic failures are not rate limits");
}
console.log("Picker error messages distinguish Riot limits, local limits and other failures without leaking upstream details.");
