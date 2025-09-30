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

export const CFG_SERVER = Object.freeze({
  // Database
  DATABASE_URL: must("DATABASE_URL"),

  // Stripe (server)
  STRIPE_SECRET_KEY: must("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: must("STRIPE_WEBHOOK_SECRET"),

  // Secrets
  CRON_SECRET: must("CRON_SECRET"),
  ICS_SIGN_SECRET: must("ICS_SIGN_SECRET"),

  // New secrets
  PATREON_WEBHOOK_SECRET: must("PATREON_WEBHOOK_SECRET"),
  RIOT_API_KEY: must("RIOT_API_KEY"),

  // Booking (UTC)
  booking: Object.freeze({
    BUFFER_AFTER_MIN: int("BUFFER_AFTER_MIN", 30),
    LEAD_MINUTES:     int("LEAD_MINUTES", 1080),
    MAX_ADVANCE_DAYS: int("MAX_ADVANCE_DAYS", 15),
    OPEN_HOUR:        int("OPEN_HOUR", 0),
    CLOSE_HOUR:       int("CLOSE_HOUR", 24),
    PER_DAY_CAP:      int("PER_DAY_CAP", 2),
  }),
});

export const CFG_PUBLIC = Object.freeze({
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "",
  STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
});
