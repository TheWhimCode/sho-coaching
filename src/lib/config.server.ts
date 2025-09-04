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

  // Emails
  RESEND_API_KEY: process.env.RESEND_API_KEY!,
  EMAIL_FROM: process.env.EMAIL_FROM!,

  // Secrets
  CRON_SECRET: must("CRON_SECRET"),
  ICS_SIGN_SECRET: must("ICS_SIGN_SECRET"),

  // Booking config
  booking: Object.freeze({
    BUFFER_BEFORE_MIN: int("BUFFER_BEFORE_MIN", 15),
    BUFFER_AFTER_MIN:  int("BUFFER_AFTER_MIN", 15),
    LEAD_MINUTES:      int("LEAD_MINUTES", 120),
    MAX_ADVANCE_DAYS:  int("MAX_ADVANCE_DAYS", 28),
    OPEN_HOUR:         int("OPEN_HOUR", 13),
    CLOSE_HOUR:        int("CLOSE_HOUR", 24),
    PER_DAY_CAP:       int("PER_DAY_CAP", 0),
  }),
});
