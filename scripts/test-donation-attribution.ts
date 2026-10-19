import assert from "node:assert/strict";
import { donationAttribution } from "../src/lib/checkout/donationAttribution";

for (const [source, page, label] of [
  ["guide", "/guide", "Donation - Viego Guide"],
  ["build_recommender", "/guide/build", "Donation - Viego Build Recommender"],
] as const) {
  const result = donationAttribution(source)!;
  assert.equal(result.payment_intent_data?.description, label);
  assert.deepEqual(result.metadata, { type: "guide_donation", source, source_page: page });
  assert.deepEqual(result.payment_intent_data?.metadata, result.metadata, "Tag both the payment and Checkout Session");
}
assert.deepEqual(donationAttribution(undefined), donationAttribution("guide"), "Old browser tabs retain guide-donation behavior");
for (const source of [null, "unknown", "https://other.invalid", {}, 42]) {
  assert.equal(donationAttribution(source), null, "Reject unknown source labels");
}
console.log("Guide/build donation descriptions, session/payment metadata, legacy fallback and source validation passed. No Stripe calls made.");
