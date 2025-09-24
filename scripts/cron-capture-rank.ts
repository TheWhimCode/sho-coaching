// scripts/cron-capture-ranks.ts
import 'dotenv/config';
import { prisma } from '@/lib/prisma';
import { soloQueueEntry, probeSummonerEverywhere } from '@/lib/riot';

// ------- Config -------
const CONCURRENCY = Number(process.env.CRON_CONCURRENCY ?? 4);
const MAX_RETRIES = 4;
const BASE_DELAY_MS = 500;

// ------- Helpers -------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (e: any) {
      attempt++;
      const msg = e?.message ?? String(e);
      // Backoff on rate limits or transient server errors
      const transient =
        msg.includes('429') ||
        msg.includes('502') ||
        msg.includes('503') ||
        msg.includes('504') ||
        msg.toLowerCase().includes('timeout');

      if (!transient || attempt > MAX_RETRIES) {
        throw e;
      }

      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.warn(`[retry ${attempt}/${MAX_RETRIES}] ${label} → waiting ${delay}ms :: ${msg}`);
      await sleep(delay);
    }
  }
}

function todayUtcBounds() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

type StudentLite = {
  id: string;
  name: string;
  puuid: string | null;
  server: string | null;
  summonerId: string | null;
};

async function ensureServerAndSummoner(s: StudentLite) {
  if (s.server && s.summonerId) return { server: s.server, summonerId: s.summonerId, repaired: false };

  if (!s.puuid) throw new Error('no puuid');

  const probed = await withRetry(() => probeSummonerEverywhere(s.puuid!), `probe(${s.name})`);
  if (!probed.found) throw new Error('no LoL summoner (probe failed)');

  const server = probed.found.server;
  const summonerId = probed.found.id;

  await prisma.student.update({
    where: { id: s.id },
    data: { server, summonerId },
  });

  return { server, summonerId, repaired: true };
}

async function alreadyCapturedToday(puuid: string) {
  const { start, end } = todayUtcBounds();
  const count = await prisma.rankSnapshot.count({
    where: { puuid, capturedAt: { gte: start, lt: end } },
  });
  return count > 0;
}

async function captureOne(s: StudentLite) {
  if (!s.puuid) return { status: 'skip', reason: 'no puuid' as const };

  // Idempotency: skip if already captured today
  if (await alreadyCapturedToday(s.puuid)) {
    return { status: 'skip', reason: 'already captured today' as const };
  }

  // Ensure platform + summoner id
  const { server, summonerId, repaired } = await ensureServerAndSummoner(s);

  // Fetch SoloQ entry with retries
  const entry = await withRetry(
    () => soloQueueEntry(server!, summonerId!),
    `leagueEntry(${s.name}:${server})`,
  );

  if (!entry) {
    return { status: 'skip', reason: 'unranked' as const, repaired };
  }

  // Write snapshot
  await prisma.rankSnapshot.create({
    data: {
      puuid: s.puuid!,
      server,
      tier: entry.tier,
      division: entry.division ?? null,
      lp: entry.lp,
    },
  });

  return {
    status: 'ok' as const,
    repaired,
    tier: entry.tier,
    division: entry.division ?? '',
    lp: entry.lp,
  };
}

// Simple promise pool for concurrency control (no extra deps)
async function runPool<T, R>(items: T[], limit: number, worker: (it: T) => Promise<R>) {
  const results: R[] = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx]);
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  const students = (await prisma.student.findMany({
    select: { id: true, name: true, puuid: true, server: true, summonerId: true },
  })) as StudentLite[];

  console.log(`Found ${students.length} students`);
  let ok = 0, skipped = 0, errors = 0, repaired = 0;

  const results = await runPool(students, CONCURRENCY, async (s) => {
    try {
      const res = await captureOne(s);
      if (res.status === 'ok') {
        ok++;
        if (res.repaired) repaired++;
        console.log(`OK   ${s.name}: ${res.tier} ${res.division} ${res.lp}LP${res.repaired ? ' [repaired]' : ''}`);
      } else if (res.status === 'skip') {
        skipped++;
        const reason = (res as any).reason ?? 'skip';
        const rep = (res as any).repaired ? ' [repaired]' : '';
        console.log(`SKIP ${s.name}: ${reason}${rep}`);
      }
      return res;
    } catch (e: any) {
      errors++;
      console.error(`ERR  ${s.name}:`, e?.message ?? String(e));
      return { status: 'err', message: e?.message ?? String(e) };
    }
  });

  console.log(`Done. OK=${ok}, Skipped=${skipped}, Errors=${errors}, Repaired=${repaired}`);
  return results;
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
