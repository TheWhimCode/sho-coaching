// src/lib/paypal.ts
import "server-only";
import { CFG_SERVER } from "@/lib/config.server";

// Pick the correct REST base URL from env
const base =
  CFG_SERVER.paypal.ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

// Simple bearer-token cache
let cachedToken: { token: string; expMs: number } | null = null;

function b64(s: string) {
  return Buffer.from(s).toString("base64");
}

export async function getPaypalAccessToken(): Promise<string> {
  // Reuse cached token if it’s still valid for at least 10s
  const now = Date.now();
  if (cachedToken && cachedToken.expMs > now + 10_000) {
    return cachedToken.token;
  }

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${b64(
        `${CFG_SERVER.paypal.CLIENT_ID}:${CFG_SERVER.paypal.SECRET}`
      )}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const json = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    console.error("paypal_oauth_failed", res.status, json);
    throw new Error(`paypal_oauth_failed:${res.status}`);
  }

  const token = json.access_token as string;
  const expiresIn = (json.expires_in as number | undefined) ?? 3000; // seconds
  cachedToken = { token, expMs: now + expiresIn * 1000 };
  return token;
}

export async function paypalCreateOrder(body: any, requestId?: string) {
  const token = await getPaypalAccessToken();
  const res = await fetch(`${base}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(requestId ? { "PayPal-Request-Id": requestId } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const dbg = res.headers.get("paypal-debug-id");
    console.error("paypal_create_error", {
      status: res.status,
      debug_id: dbg,
      body: data,
    });
    throw new Error(`paypal_create_failed:${res.status}`);
  }
  return data; // includes { id: "ORDER_ID" }
}

export async function paypalCaptureOrder(orderId: string) {
  const token = await getPaypalAccessToken();
  const res = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
  });

  const json = await res.json().catch(() => ({} as any));
  if (!res.ok) {
    console.error("paypal_capture_error", res.status, json);
    throw new Error(`paypal_capture_failed:${res.status}`);
  }
  return json;
}
