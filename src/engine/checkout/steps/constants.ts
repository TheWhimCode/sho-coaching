// engine/checkout/steps/constants.ts
// Checkout step indices and constants — single source of truth for the flow.

/** Valid checkout step indices: 0 = contact, 1 = champion, 2 = choose payment, 3 = summary + pay. */
export type CheckoutStep = 0 | 1 | 2 | 3;

export const STEP_CONTACT: CheckoutStep = 0;
export const STEP_CHAMPION: CheckoutStep = 1;
export const STEP_CHOOSE: CheckoutStep = 2;
export const STEP_PAYMENT: CheckoutStep = 3;

/** Last step index (summary + payment). */
export const LAST_STEP: CheckoutStep = 3;

export const CHECKOUT_STEPS = {
  contact: STEP_CONTACT,
  champion: STEP_CHAMPION,
  choose: STEP_CHOOSE,
  payment: STEP_PAYMENT,
  last: LAST_STEP,
} as const;
