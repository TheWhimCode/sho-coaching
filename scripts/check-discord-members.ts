/**
 * Match a list of Discord display names against guild members and/or local DB records.
 *
 * Discord (authoritative for server membership):
 *   DISCORD_BOT_TOKEN=... DISCORD_GUILD_ID=... npx tsx scripts/check-discord-members.ts
 *
 * DB-only fallback (students + speed-review queue who booked/joined via site):
 *   npx tsx scripts/check-discord-members.ts --db-only
 */
import { config } from "dotenv";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Next.js uses .env.local; load it for one-off scripts too.
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });
import { PrismaClient } from "@prisma/client";

const NAMES_FILE = resolve(__dirname, "check-discord-members.txt");

type DiscordMember = {
  user: {
    id: string;
    username: string;
    global_name: string | null;
  };
  nick: string | null;
};

type MatchResult = {
  query: string;
  discordId: string | null;
  matchedAs: string | null;
  source: "discord" | "student" | "speed_review" | null;
};

function normalizeName(s: string): string {
  const trimmed = s.trim();
  if (!trimmed) return "";
  // Legacy tag: Ice3#6175 → ice3
  const noTag = trimmed.includes("#") ? trimmed.split("#")[0]! : trimmed;
  return noTag.toLowerCase();
}

function loadQueries(): string[] {
  const raw = readFileSync(NAMES_FILE, "utf8");
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function memberAliases(m: DiscordMember): string[] {
  const out = new Set<string>();
  out.add(normalizeName(m.user.username));
  if (m.user.global_name) out.add(normalizeName(m.user.global_name));
  if (m.nick) out.add(normalizeName(m.nick));
  return [...out];
}

async function fetchAllGuildMembers(
  token: string,
  guildId: string
): Promise<DiscordMember[]> {
  const members: DiscordMember[] = [];
  let after = "0";

  for (;;) {
    const url = new URL(`https://discord.com/api/v10/guilds/${guildId}/members`);
    url.searchParams.set("limit", "1000");
    if (after !== "0") url.searchParams.set("after", after);

    const res = await fetch(url, {
      headers: { Authorization: `Bot ${token}` },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Discord API ${res.status}: ${body}`);
    }

    const batch = (await res.json()) as DiscordMember[];
    if (!batch.length) break;

    members.push(...batch);
    after = batch[batch.length - 1]!.user.id;

    if (batch.length < 1000) break;
  }

  return members;
}

function matchInGuild(
  queries: string[],
  members: DiscordMember[]
): Map<string, MatchResult> {
  const aliasToMember = new Map<string, DiscordMember>();
  for (const m of members) {
    for (const alias of memberAliases(m)) {
      if (!aliasToMember.has(alias)) aliasToMember.set(alias, m);
    }
  }

  const results = new Map<string, MatchResult>();
  for (const query of queries) {
    const key = normalizeName(query);
    const member = aliasToMember.get(key);
    results.set(query, {
      query,
      discordId: member?.user.id ?? null,
      matchedAs: member
        ? member.nick ??
          member.user.global_name ??
          member.user.username
        : null,
      source: member ? "discord" : null,
    });
  }
  return results;
}

async function matchInDb(
  queries: string[],
  existing: Map<string, MatchResult>
): Promise<Map<string, MatchResult>> {
  const prisma = new PrismaClient();
  const wanted = new Set(queries.map(normalizeName));

  try {
    const [students, queue] = await Promise.all([
      prisma.student.findMany({
        where: { discordName: { not: null } },
        select: { discordId: true, discordName: true },
      }),
      prisma.speedReviewQueue.findMany({
        select: { discordId: true, discordName: true },
      }),
    ]);

    const aliasToRecord = new Map<
      string,
      { discordId: string; label: string; source: "student" | "speed_review" }
    >();

    for (const s of students) {
      if (!s.discordName || !s.discordId) continue;
      aliasToRecord.set(normalizeName(s.discordName), {
        discordId: s.discordId,
        label: s.discordName,
        source: "student",
      });
    }

    for (const q of queue) {
      if (!q.discordName) continue;
      const key = normalizeName(q.discordName);
      if (!aliasToRecord.has(key)) {
        aliasToRecord.set(key, {
          discordId: q.discordId,
          label: q.discordName,
          source: "speed_review",
        });
      }
    }

    const out = new Map(existing);
    for (const query of queries) {
      if (out.get(query)?.discordId) continue;
      const hit = aliasToRecord.get(normalizeName(query));
      if (hit) {
        out.set(query, {
          query,
          discordId: hit.discordId,
          matchedAs: hit.label,
          source: hit.source,
        });
      } else if (!out.has(query)) {
        out.set(query, {
          query,
          discordId: null,
          matchedAs: null,
          source: null,
        });
      }
    }
    return out;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const dbOnly = process.argv.includes("--db-only");
  const queries = loadQueries();
  console.log(`Checking ${queries.length} names...\n`);

  let results = new Map<string, MatchResult>();
  for (const q of queries) {
    results.set(q, {
      query: q,
      discordId: null,
      matchedAs: null,
      source: null,
    });
  }

  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  const guildId = process.env.DISCORD_GUILD_ID?.trim();

  if (!dbOnly && token && guildId) {
    console.log("Fetching guild members from Discord...");
    const members = await fetchAllGuildMembers(token, guildId);
    console.log(`Loaded ${members.length} guild members.\n`);
    results = matchInGuild(queries, members);
  } else if (!dbOnly) {
    console.log(
      "Skipping Discord API (set DISCORD_BOT_TOKEN + DISCORD_GUILD_ID, or pass --db-only).\n"
    );
  }

  console.log("Cross-checking local DB (students + speed-review queue)...");
  results = await matchInDb(queries, results);

  const found = [...results.values()].filter((r) => r.discordId);
  const missing = [...results.values()].filter((r) => !r.discordId);

  console.log("\n=== IN SERVER / KNOWN ===\n");
  for (const r of found.sort((a, b) => a.query.localeCompare(b.query))) {
    console.log(`${r.query}\t${r.discordId}\t(${r.source}: ${r.matchedAs})`);
  }

  console.log(`\n=== NOT FOUND (${missing.length}) ===\n`);
  for (const r of missing.sort((a, b) => a.query.localeCompare(b.query))) {
    console.log(r.query);
  }

  console.log(
    `\nSummary: ${found.length} matched, ${missing.length} not found, ${queries.length} total.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
