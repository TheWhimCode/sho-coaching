import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "admin_auth";
export const ADMIN_SESSION_SECONDS = 12 * 60 * 60;

function signingKey() {
  const password = process.env.ADMIN_SECRET;
  if (!password) return null;
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET || password)
    .update(`admin-session-key:v1:${password}`).digest();
}

export function validAdminPassword(value: unknown): boolean {
  const expected = process.env.ADMIN_SECRET;
  if (!expected || typeof value !== "string" || value.length > 1024) return false;
  return timingSafeEqual(createHash("sha256").update(value).digest(), createHash("sha256").update(expected).digest());
}

export function createAdminSession(now = Date.now()): string {
  const key = signingKey();
  if (!key) throw new Error("Admin login is not configured");
  const issued = Math.floor(now / 1000);
  const payload = `v1.${issued}.${issued + ADMIN_SESSION_SECONDS}.${randomBytes(24).toString("base64url")}`;
  return `${payload}.${createHmac("sha256", key).update(payload).digest("base64url")}`;
}

export function verifyAdminSession(token: string | undefined, now = Date.now()): boolean {
  const key = signingKey();
  if (!key || !token || token.length > 256) return false;
  const match = /^v1\.(\d{10})\.(\d{10})\.([A-Za-z0-9_-]{32})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match) return false;
  const issued = Number(match[1]);
  const expires = Number(match[2]);
  const seconds = Math.floor(now / 1000);
  if (issued > seconds + 30 || expires <= seconds || expires - issued !== ADMIN_SESSION_SECONDS) return false;
  const payload = token.slice(0, token.lastIndexOf("."));
  const expected = Buffer.from(createHmac("sha256", key).update(payload).digest("base64url"));
  const actual = Buffer.from(match[4]);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
