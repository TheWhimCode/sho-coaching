import assert from "node:assert/strict";
import { loadEnvConfig } from "@next/env";

async function main() {
  // Use the configured password only in memory and only against this local server.
  const { combinedEnv } = loadEnvConfig(process.cwd());
  assert.ok(combinedEnv.ADMIN_SECRET, "Admin password must be configured for the login check");
  const base = "http://localhost:3000";
  // Simulate the HTTPS reverse proxy in front of the local HTTP production server.
  const request = (path: string, init: RequestInit = {}) => fetch(`${base}${path}`, {
    ...init, headers: { "x-forwarded-proto": "https", ...init.headers },
  });
  const login = await request("/api/admin/auth/login", {
    method: "POST", headers: { "content-type": "application/json", origin: "https://localhost:3000" },
    body: JSON.stringify({ password: combinedEnv.ADMIN_SECRET }),
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie") ?? "";
  assert.match(cookie, /admin_auth=v1\./);
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /Secure/i);
  assert.match(cookie, /SameSite=strict/i);
  assert.match(cookie, /Max-Age=43200/i);
  const verified = await request("/api/admin/security-check-not-a-real-route", { headers: { cookie: cookie.split(";")[0] } });
  assert.equal(verified.status, 404, "A legitimate login passes the proxy to the nonexistent route, without reading private data");
  const logout = await request("/api/admin/auth/logout", { method: "POST", headers: { origin: "https://localhost:3000", cookie: cookie.split(";")[0] } });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie") ?? "", /Max-Age=0/i);
  const debug = await request("/api/dev/debug-onboard", { method: "POST", body: "{}" });
  assert.equal(debug.status, 404);
  const mock = await request("/api/guide/live-game?riotId=Viego%23DEMO&mock=1", { headers: { "x-forwarded-for": "192.0.2.56" } });
  assert.equal(mock.status, 400);
  console.log("Production login, secure cookie, authenticated proxy, logout and disabled debug/mock checks passed. No credentials or tokens logged.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
