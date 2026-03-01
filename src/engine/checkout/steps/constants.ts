// engine/checkout/steps/constants.ts
// Checkout step indices and constants — single source of truth for the flow.

/** Valid checkout step indices: 0 = contact, 1 = choose payment, 2 = summary + pay. */
export type CheckoutStep = 0 | 1 | 2;

export const STEP_CONTACT: CheckoutStep = 0;
export const STEP_CHOOSE: CheckoutStep = 1;
export const STEP_PAYMENT: CheckoutStep = 2;

/** Last step index (summary + payment). */
export const LAST_STEP: CheckoutStep = 2;

export const CHECKOUT_STEPS = {
  contact: STEP_CONTACT,
  choose: STEP_CHOOSE,
  payment: STEP_PAYMENT,
  last: LAST_STEP,
} as const;
