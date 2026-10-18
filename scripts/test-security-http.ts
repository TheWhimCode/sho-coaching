import assert from "node:assert/strict";

async function main() {
  const base = "http://localhost:3000";
  const forged = await fetch(`${base}/api/admin/students`, { headers: { cookie: "admin_auth=1" } });
  assert.equal(forged.status, 401);
  const missing = await fetch(`${base}/admin`, { redirect: "manual" });
  assert.equal(missing.status, 307);
  assert.ok(missing.headers.get("location")?.includes("/admin/login"));
  const crossOrigin = await fetch(`${base}/api/admin/auth/login`, { method: "POST", headers: { origin: "https://other.invalid" }, body: "{}" });
  assert.equal(crossOrigin.status, 403);
  const oversized = await fetch(`${base}/api/guide/live-game?riotId=${"x".repeat(600)}`);
  assert.equal(oversized.status, 400);
  // Reserved documentation IP isolates the local test from the user's normal bucket.
  // No Riot calls or business-data writes: every request is invalid input.
  const responses = [];
  for (let i = 0; i < 21; i++) {
    responses.push(await fetch(`${base}/api/guide/live-game?riotId=invalid`, { headers: { "x-forwarded-for": "192.0.2.55" } }));
  }
  assert.equal(responses.filter(response => response.status === 400).length, 20);
  const limited = responses[20];
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get("retry-after")) > 0);
  assert.equal((await limited.json()).status, "error");
  const page = await fetch(`${base}/guide/build`);
  assert.equal(page.status, 200);
  assert.ok((await page.text()).includes("Try a random game"));
  console.log("HTTP admin-forgery rejection, cross-origin protection, picker throttling and page checks passed.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
