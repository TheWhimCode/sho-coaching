import { SITE_URL } from "./site";

export const CFG_PUBLIC = Object.freeze({
  SITE_URL,

  // Stripe (client)
  STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
});
