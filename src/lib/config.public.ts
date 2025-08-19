export const CFG_PUBLIC = {
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "",

  // Stripe (client)
  STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",

  // PayPal (client — used for JS SDK)
  PAYPAL_CLIENT_ID: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "",
};
