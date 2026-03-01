# Prisma & Postgres: doing it reliably in Cursor

## Will changes in Cursor work reliably?

Yes. Working in Cursor with the real codebase and terminal is the right way to do it. The main causes of "migration problems" in the past were usually:

1. **No backup** before a migration that could change or drop data.
2. **Copy-pasting schema snippets** into an external chat, so the full schema and env weren’t in sync.
3. **Running destructive migrations** (e.g. `drop` or big `alter`) without a clear plan.

If you **back up first**, **run one migration at a time**, and **avoid destructive steps** until you’re sure, Cursor + Prisma is reliable.

---

## Safe workflow for schema changes

1. **Back up the database** (e.g. pg_dump or your host’s backup) before any migration that touches existing tables.
2. **Edit `prisma/schema.prisma`** in Cursor (you’re already in the real project).
3. **Create a migration** (don’t skip this step):
   ```bash
   npx prisma migrate dev --name describe_your_change
   ```
   This creates a new SQL file under `prisma/migrations/` and applies it. If you use a production DB, use `prisma migrate deploy` there after testing.
4. **Regenerate the client** (often done automatically by `migrate dev`):
   ```bash
   npx prisma generate
   ```
   If you get a "operation not permitted" / rename error on Windows, close the Next.js dev server (and any other process that might be using `node_modules/.prisma`), then run `npx prisma generate` again.

---

## Current setup: `public` vs `skillcheck` schema

- **`public`**: main app (Slot, Session, Student, **Draft**, etc.).
- **`skillcheck`**: only **CooldownStat** and **ItemStat** so far. The `skillcheck` schema exists in Postgres; Prisma is configured with `schemas = ["public", "skillcheck"]`.

**Draft** is still in `public`. Moving it to `skillcheck` later is possible without losing data if you do it in steps (see below).

---

## Moving Draft (or other tables) into `skillcheck` without losing rows

If you later want all skillcheck tables in the `skillcheck` schema:

1. **Back up the database.**
2. **Create the table in the new schema**  
   In `schema.prisma`, add a new model (e.g. `DraftSkillcheck`) with `@@schema("skillcheck")` and the same fields as `Draft`, then run:
   ```bash
   npx prisma migrate dev --name add_draft_to_skillcheck_schema
   ```
   That creates `skillcheck.draft` (or whatever name you use).
3. **Copy data** (one-time): run a small script or raw SQL that does:
   ```sql
   INSERT INTO skillcheck."Draft" (id, "blue", "red", ...)
   SELECT id, "blue", "red", ... FROM public."Draft";
   ```
   (Use the real column names from your migration.)
4. **Point the app to the new table**  
   In Prisma, remove the old `Draft` model from `public` and keep only the one in `skillcheck` (or rename the new model to `Draft` and delete the old one). Then create a new migration that **drops** `public."Draft"` (only after you’ve verified the copy and switched the app).

Alternatively you can use a single migration with **raw SQL** that creates `skillcheck."Draft"`, copies the rows, then drops `public."Draft"` — but doing it in two migrations (create + copy, then drop) is easier to reason about and roll back.

### Draft move (done in this repo)

1. **Migration `20260301214837_draft_move_to_skillcheck_copy`** – Creates `skillcheck."DraftStatus"` and `skillcheck."Draft"`, copies all rows from `public."Draft"`.
2. **Schema** – `Draft` and `DraftStatus` now have `@@schema("skillcheck")` so the app uses the skillcheck table.
3. **Verify** (before applying the drop): In your DB client or `psql`, run:
   ```sql
   SELECT COUNT(*) FROM public."Draft";
   SELECT COUNT(*) FROM skillcheck."Draft";
   ```
   The two counts must match.
4. **Migration `20260301220000_draft_drop_public`** – Drops `public."Draft"` and `public."DraftStatus"`. Apply with:
   ```bash
   npx prisma migrate deploy
   ```
   (Use `migrate deploy` to avoid the interactive “drop non-empty table” prompt; you already verified the copy.)

---

## Items game: what was added

- **`ItemStat`** in the `skillcheck` schema: one row per (dayKey, itemId), with `attempts` and `correctAttempts`.
- **POST `/api/skillcheck/items/attempt`**: upserts `ItemStat` for each guess (dayKey, itemId, correct).
- **Items page**: loads `ItemStat` for the day’s puzzle and passes `avgAttempts` into the client so the result screen can show it.

After pulling these changes, run:

```bash
npx prisma migrate dev --name add_item_stat
npx prisma generate
```

If `generate` fails on Windows with a rename/permission error, close the dev server and any IDE/process using the project, then run `npx prisma generate` again.

---

## Disaster recovery: "Drift detected" / "migrations applied but absent"

If you see **drift** or **"Migrations applied to the database but absent from the migrations directory"** (e.g. after renaming or moving migration folders), you can fix the migration history **without resetting** (no data loss):

1. **Back up the database** (optional but recommended).
2. From the project root, run the one-time repair script:
   ```bash
   node prisma/repair-migration-history.mjs
   ```
   It will:
   - Remove the old migration names from `_prisma_migrations` (20250128, 202512XX, 20251227).
   - Update the checksum for `20251227030003_add_submit_ip` so it matches the current file.
   - Insert rows for the renamed migrations so Prisma treats them as already applied.
3. Then run:
   ```bash
   npx prisma migrate dev --name add_item_stat
   ```
   Prisma should no longer ask for a reset, and it will create and apply only the new migration (e.g. ItemStat).

If you don’t have Node set up to load `.env` automatically, set the connection string first:
   ```bash
   set DATABASE_URL=your_connection_string
   node prisma/repair-migration-history.mjs
   ```
   (On Unix/macOS use `export DATABASE_URL=...`.)
