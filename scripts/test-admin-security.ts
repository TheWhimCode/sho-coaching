import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { proxy } from "../src/proxy";
import { ADMIN_SESSION_SECONDS, createAdminSession, validAdminPassword, verifyAdminSession } from "../src/lib/admin/session";
import { readLimitedText } from "../src/lib/security/requestBody";

async function main() {
  const original = process.env.ADMIN_SECRET;
  const originalSigning = process.env.ADMIN_SESSION_SECRET;
  try {
    process.env.ADMIN_SECRET = "test-only-admin-password";
    process.env.ADMIN_SESSION_SECRET = "test-only-independent-signing-key";
    const now = 1_792_281_600_000;
    const token = createAdminSession(now);
    assert.equal(verifyAdminSession(token, now), true);
    assert.equal(verifyAdminSession("1", now), false);
    assert.equal(verifyAdminSession(undefined, now), false);
    assert.equal(verifyAdminSession(token, now + ADMIN_SESSION_SECONDS * 1000), false);
    assert.equal(verifyAdminSession(token, now - 60_000), false);
    assert.equal(verifyAdminSession(token.replace("v1.", "v2."), now), false);
    const parts = token.split(".");
    parts[2] = String(Number(parts[2]) + 3600);
    assert.equal(verifyAdminSession(parts.join("."), now), false);
    parts[2] = token.split(".")[2];
    parts[3] = "A".repeat(32);
    assert.equal(verifyAdminSession(parts.join("."), now), false);
    assert.equal(validAdminPassword("test-only-admin-password"), true);
    assert.equal(validAdminPassword("wrong"), false);
    assert.equal(validAdminPassword({ password: "test-only-admin-password" }), false);
    assert.equal(await readLimitedText(new Request("http://localhost", { method: "POST", body: "{}" }), 10), "{}");
    await assert.rejects(readLimitedText(new Request("http://localhost", { method: "POST", body: "x".repeat(20) }), 10), RangeError);
    await assert.rejects(readLimitedText(new Request("http://localhost", { method: "POST", headers: { "content-length": "100" }, body: "{}" }), 10), RangeError);
    process.env.ADMIN_SECRET = "rotated-test-password";
    assert.equal(verifyAdminSession(token, now), false);
    const forged = await proxy(new NextRequest("http://localhost:3000/api/admin/students", { headers: { cookie: "admin_auth=1" } }));
    assert.equal(forged.status, 401);
    const missing = await proxy(new NextRequest("http://localhost:3000/admin"));
    assert.equal(missing.status, 307);
    const valid = await proxy(new NextRequest("http://localhost:3000/api/admin/students", { headers: { cookie: `admin_auth=${createAdminSession()}` } }));
    assert.equal(valid.headers.get("x-middleware-next"), "1");
    const crossOrigin = await proxy(new NextRequest("http://localhost:3000/api/admin/appointments", { method: "POST", headers: { origin: "https://other.invalid", cookie: `admin_auth=${createAdminSession()}` } }));
    assert.equal(crossOrigin.status, 403);
    const authPrefix = await proxy(new NextRequest("http://localhost:3000/api/admin/auth/anything"));
    assert.equal(authPrefix.status, 401);
    delete process.env.ADMIN_SECRET;
    assert.equal(verifyAdminSession(token, now), false);
    assert.equal(validAdminPassword(""), false);
    assert.throws(() => createAdminSession());
    console.log("Admin session forgery, expiry, rotation, proxy and origin checks passed.");
  } finally {
    if (original === undefined) delete process.env.ADMIN_SECRET; else process.env.ADMIN_SECRET = original;
    if (originalSigning === undefined) delete process.env.ADMIN_SESSION_SECRET; else process.env.ADMIN_SESSION_SECRET = originalSigning;
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
