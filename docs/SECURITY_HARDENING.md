# Admin sessions and public lookup protection

Implemented 2026-10-18. Deploy the application changes after `npx prisma migrate deploy` and `npx prisma generate`.

## Admin access

- Login issues a random, HMAC-signed session valid for 12 hours. The old `admin_auth=1` flag is rejected.
- `ADMIN_SECRET` remains the login password. Keep it long, random and unique. Optional `ADMIN_SESSION_SECRET` provides a separate signing secret. Changing either invalidates all sessions.
- Production cookies use HttpOnly, Secure and SameSite=Strict. Logout clears the browser cookie; a stolen signed token remains valid until expiry or secret rotation.
- Only the exact login/logout paths bypass session verification. Cross-origin administrative writes are rejected when an Origin header is present.
- Login is limited to 10 attempts per visitor per minute and 100 site-wide per minute.

## Lookup budgets and caching

- Picker requests: 20 per visitor per minute, 600 site-wide per minute, including cache hits. Public `/api/riot/*` routes have the same budgets in a separate group.
- All outgoing Riot requests use a shared conservative allowance of 90 per two minutes and 18 per second, across instances and callers. This is deliberately conservative and independent of regional allowances. Increase only after verifying the actual key's quotas. Under a surge, users can receive 429 responses instead of additional upstream work.
- Repeated live lookups use a 15-second Next data cache; finished matches use five minutes. Only successful function results are cached; thrown errors are not. Public champion ratings are cached for one minute. The public picker page can be regenerated once per minute in production.
- Per-instance identical requests share pending work; at most 32 distinct picker requests may be pending. Riot's local queue is bounded to 12 waiting jobs. Picker Riot calls share a 20-second deadline and each HTTP request times out after at most 12 seconds.
- Riot hosts are allowlisted and redirects rejected before sending the API key. Production rejects the old mock endpoint flag and disables the debug-onboard route. The random-game button still works entirely in the browser.
- Shared limit counters live in `public.RequestLimit`; updates are atomic and failures reject requests. The counter table stores reusable visitor hash buckets rather than IP addresses. Each endpoint group has at most 65,536 visitor keys; rare collisions share a quota. No scheduled database cleanup is required.
- Visitor identity uses X-Forwarded-For, which Vercel overwrites. If deploying behind a different proxy, configure it to overwrite this header. Global outgoing budgets still apply if visitor identity is unavailable or spoofed.

These application guards do not stop network-level DDoS or eliminate hosting charges. Hosting firewall/edge limits and spending alerts require separate configuration and were not changed. Coaching-note and booking-ownership issues identified in the review are outside this change.

## Verification

- `npx tsx scripts/test-admin-security.ts`
- `npx tsx scripts/test-riot-security.ts` (network and database are mocked)
- `npx tsx scripts/test-request-limits.ts` (uses the configured database; every test counter write is rolled back)
- `npx tsc --noEmit -p tsconfig.json`
