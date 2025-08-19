// src/lib/config.public.ts
export const CFG_PUBLIC = {
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "",
  STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
  PAYPAL_CLIENT_ID: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "",
};
