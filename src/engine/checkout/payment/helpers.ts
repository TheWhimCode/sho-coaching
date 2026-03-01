// engine/checkout/payment/helpers.ts
// Pure helpers for payment method branching (card vs alternative).

import type { PayMethod } from "../model/types";

export function isCard(payMethod: PayMethod): boolean {
  return payMethod === "card";
}

/** PayPal, Klarna, or Revolut Pay — use PaymentIntent + embedded flow. */
export function isAlternativePayment(payMethod: PayMethod): boolean {
  return payMethod === "paypal" || payMethod === "klarna" || payMethod === "revolut_pay";
}

/**
 * Stripe payment_method_types for PaymentIntent.create.
 * Card → ["card"]; others → single-element array with that method.
 */
export function getStripePaymentMethodTypes(payMethod: PayMethod): string[] {
  if (payMethod === "paypal") return ["paypal"];
  if (payMethod === "revolut_pay") return ["revolut_pay"];
  if (payMethod === "klarna") return ["klarna"];
  return ["card"];
}
