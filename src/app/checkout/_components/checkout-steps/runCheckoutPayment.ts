// Checkout payment execution: card → Stripe Checkout redirect; alternative → mount Payment Element + confirmPayment.
// Keeps payment logic out of the hook and panel for testability and smaller hook size.

import type { Stripe } from "@stripe/stripe-js";
import type { PayMethod } from "@/engine/checkout";
import { isCard, isAlternativePayment } from "@/engine/checkout";

export type RunCheckoutPaymentParams = {
  stripe: Stripe;
  payMethod: PayMethod;
  bookingId: string | null;
  clientSecret: string | null;
  createPaymentIntent: () => Promise<string | null>;
  slotIds: string | undefined;
  amountCents: number;
  productId?: string | null;
  paymentElementId?: string;
};

/**
 * Run the appropriate payment flow: card redirects to Stripe Checkout;
 * PayPal/Klarna/Revolut mount the Payment Element and confirm in-page.
 */
export async function runCheckoutPayment(params: RunCheckoutPaymentParams): Promise<void> {
  const {
    stripe,
    payMethod,
    bookingId,
    clientSecret,
    createPaymentIntent,
    slotIds,
    amountCents,
    productId,
    paymentElementId = "hidden-payment-element",
  } = params;

  if (isCard(payMethod)) {
    const resp = await fetch("/api/stripe/checkout/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "card",
        amountCents,
        bookingId,
        slotIds: slotIds || undefined,
        productId: productId || undefined,
      }),
    });

    const data = await resp.json().catch(() => null);
    if (data?.url) {
      window.location.href = data.url;
      return;
    }
    console.error("Failed to create Checkout Session", data);
    return;
  }

  if (isAlternativePayment(payMethod)) {
    const secret = clientSecret ?? (await createPaymentIntent());
    if (!secret) {
      console.error("Missing client secret");
      return;
    }

    const elements = stripe.elements({ clientSecret: secret });
    const paymentElement = elements.create("payment");
    paymentElement.mount(`#${paymentElementId}`);

    // Wait for Payment Element (especially PayPal) to be ready before confirmPayment.
    // A fixed delay is unreliable; the first attempt can hang on "Just a moment..." until
    // the user goes back and retries. Using the ready event fixes this.
    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        try {
          paymentElement.off("ready", onReady);
        } catch {
          /* ignore */
        }
        clearTimeout(timer);
        resolve();
      };
      const onReady = finish;
      paymentElement.on("ready", onReady);
      const timer = setTimeout(finish, 8000); // fallback if ready never fires
    });

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + "/checkout/success" },
    });

    if (result.error) console.error("Payment failed:", result.error.message);
  }
}
