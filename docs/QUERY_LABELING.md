# Prisma query labeling (Neon / Vercel)

## What you get

- Every Prisma operation runs with an optional **label** stored in `AsyncLocalStorage`.
- The extended client logs **structured JSON** with:
  - `label` — e.g. `GET /api/skillcheck/leaderboard` (or `unlabeled` if you didn’t set one)
  - `model` — Prisma model name, or `$queryRaw` for raw SQL
  - `operation` — `findMany`, `update`, `execute`, …
  - `ms` — duration

**Default:** only logs operations **≥ `PRISMA_LOG_SLOW_MS`** (default **100ms**) as **`console.warn`** (JSON line).

**Verbose:** set **`PRISMA_QUERY_LOGS=1`** to **`console.log`** **every** Prisma call (noisy; use for short debugging).

## How to label a route

Wrap the handler body so all `prisma` calls inherit the label:

```ts
import { runWithRequestQueryLabelAsync } from "@/lib/queryContext";

export async function GET(req: Request) {
  return runWithRequestQueryLabelAsync(req, async () => {
    // prisma.* here will log with label: "GET /api/your/path"
    return NextResponse.json({ ok: true });
  });
}
```

Sync variant: `runWithRequestQueryLabel(req, () => { ... })`.

Custom label (cron, scripts, server components):

```ts
import { runWithQueryLabelAsync } from "@/lib/queryContext";

await runWithQueryLabelAsync("cron/daily", async () => {
  // prisma calls in manageSlots, etc.
});
```

## Neon Query Insights

Neon’s UI shows **SQL** and timing, but **not** these app labels (they are not injected into SQL comments).

To correlate:

1. **Vercel logs** — search for `"prisma":true` and the `label` field.
2. Or match **time** between a Vercel request log and a Neon slow query.
3. For **SQL text in Neon** + **service traces**, consider **OpenTelemetry** (Prisma has OTel support) — optional next step.

## Env vars

| Variable | Meaning |
|----------|--------|
| `PRISMA_QUERY_LOGS=1` | Log every Prisma op (with label) |
| `PRISMA_LOG_SLOW_MS` | Slow threshold in ms (default `100`) |
