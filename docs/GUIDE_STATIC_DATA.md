# Guide and build picker: no visitor Postgres access

`/guide`, `/guide/build`, the development scoring playground, and
`/api/guide/live-game` use `src/data/guide/champion-profiles.json` for all champion
ratings. Calculation rules remain in `src/lib/guides/buildPicker/`. Both public
pages read `src/data/guide/twitch-status.json` for the manual Twitch banner.
Cold starts, page regeneration, failed searches, live-game searches, and cached
match searches do not read or write Postgres. Riot API credentials remain in the
server environment (`RIOT_API_KEY`); they are never included in the snapshot.

## Updating published data

Edit the JSON files and deploy. All existing rating fields are preserved, including
unreviewed null values. Changes to database rows do not automatically change these
pages. The Twitch admin toggle still saves the database value for a later export;
it does not immediately change the public banner.

To deliberately replace both files with current database values:

```powershell
npx tsx scripts/export-guide-data.ts
```

This is a manual, read-only database operation. It wakes Neon once; it is **not**
part of page loading, application startup, or the build script. It overwrites file
edits, so review the diff before committing and deploying. Only public champion
ratings and manual Twitch banner fields are exported, without database timestamps.

## Public rate limits

Picker request counters and outbound Riot quotas use
`src/lib/security/publicRequestLimit.ts`, which has no Postgres fallback.
Without extra configuration it uses bounded in-memory counters **per server
instance**. They reset on cold starts and are not shared across instances. Riot's
own 429 responses are still respected, and existing per-host concurrency limits
remain in place.

For deployment-wide limits across serverless instances, set both server-only
environment variables:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

The optional Redis REST implementation uses an atomic expiring counter. A partial
configuration, unavailable Redis, or invalid response rejects the request rather
than bypassing the limit. It never contacts Neon. See the
[Redis REST API](https://upstash.com/docs/redis/features/restapi).

Admin login and unrelated application endpoints retain their existing Postgres
limits. Other site features, cron jobs, and payment webhooks may still wake Neon.
Links from the guide to database-backed pages disable automatic prefetching;
visiting those pages explicitly can still use the database.

## Verification

```powershell
npx tsc --noEmit -p tsconfig.json
npx tsx scripts/test-guide-no-database.ts
npx tsx scripts/test-public-request-limits.ts
npx tsx scripts/test-riot-security.ts
```

These tests do not require database access. The dependency check follows local
runtime imports from the guide pages, shared layout, donation-session handler,
and picker API and rejects database dependencies.
