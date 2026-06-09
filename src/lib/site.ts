/** Canonical public origin (no trailing slash). Set NEXT_PUBLIC_SITE_URL in production. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://its-mino.com"
).replace(/\/+$/, "");
