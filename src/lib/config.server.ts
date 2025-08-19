import "server-only";

const must = (k: string) => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env: ${k}`);
  return v;
};
const int = (k: string, d: number) => {
  const n = parseInt(process.env[k] ?? "", 10);
  return Number.isFinite(n) ? n : d;
};

export const CFG_SERVER = {
  // Database
  DATABASE_URL: must("DATABASE_URL"),

  // Stripe
  STRIPE_SECRET_KEY: must("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: must("STRIPE_WEBHOOK_SECRET"),

  // PayPal
  paypal: {
    CLIENT_ID: must("PAYPAL_CLIENT_ID"),   // server also needs client ID
    SECRET: must("PAYPAL_SECRET"),
    ENV: process.env.PAYPAL_ENV ?? "sandbox", // "sandbox" or "live"
  },

  // Emails
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
  EMAIL_FROM: process.env.EMAIL_FROM ?? "",

  // Site & Admin
  SITE_URL: process.env.SITE_URL ?? "",
  ADMIN_USER: process.env.ADMIN_USER ?? "admin",
  ADMIN_PASS: process.env.ADMIN_PASS ?? "change-me",

  // Booking config
  booking: {
    BUFFER_BEFORE_MIN: int("BUFFER_BEFORE_MIN", 15),
    BUFFER_AFTER_MIN:  int("BUFFER_AFTER_MIN", 15),
    LEAD_MINUTES:      int("LEAD_MINUTES", 120),
    MAX_ADVANCE_DAYS:  int("MAX_ADVANCE_DAYS", 28),
    OPEN_HOUR:         int("OPEN_HOUR", 13),
    CLOSE_HOUR:        int("CLOSE_HOUR", 24),
    PER_DAY_CAP:       int("PER_DAY_CAP", 0),
  },
};
