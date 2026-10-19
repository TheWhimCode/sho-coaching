import type Stripe from "stripe";

/** Keep legacy clients working; only accept the two known donation entry points. */
export function donationAttribution(source: unknown): Pick<Stripe.Checkout.SessionCreateParams, "metadata" | "payment_intent_data"> | null {
  if (source !== undefined && source !== "guide" && source !== "build_recommender") return null;
  const build = source === "build_recommender";
  const metadata = {
    type: "guide_donation",
    source: build ? "build_recommender" : "guide",
    source_page: build ? "/guide/build" : "/guide",
  };
  return {
    metadata,
    payment_intent_data: {
      description: build ? "Donation - Viego Build Recommender" : "Donation - Viego Guide",
      metadata: { ...metadata },
    },
  };
}
