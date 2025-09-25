// src/app/api/riot/summary/route.ts
import { NextResponse } from 'next/server';

const RIOT_KEY = process.env.RIOT_API_KEY!;
const BASE_HEADERS = { 'X-Riot-Token': RIOT_KEY };

type Region = 'americas' | 'europe' | 'asia' | 'sea';

const ALIAS_TO_PLATFORM: Record<string, string> = {
  euw: 'euw1', eu: 'euw1', euw1: 'euw1',
  eune: 'eun1', eun: 'eun1', eun1: 'eun1',
  na: 'na1', na1: 'na1',
  oce: 'oc1', oc1: 'oc1',
  lan: 'la1', la1: 'la1',
  las: 'la2', la2: 'la2',
  br: 'br1', br1: 'br1',
  tr: 'tr1', tr1: 'tr1',
  ru: 'ru',
  kr: 'kr',
  jp: 'jp1', jp1: 'jp1',
  ph: 'ph2', ph2: 'ph2',
  sg: 'sg2', sg2: 'sg2',
  th: 'th2', th2: 'th2',
  tw: 'tw2', tw2: 'tw2',
  vn: 'vn2', vn2: 'vn2',
};

const PLATFORM_TO_REGION: Record<string, Region> = {
  na1: 'americas', br1: 'americas', la1: 'americas', la2: 'americas', oc1: 'americas',
  euw1: 'europe', eun1: 'europe', tr1: 'europe', ru: 'europe',
  kr: 'asia', jp1: 'asia',
  ph2: 'sea', sg2: 'sea', th2: 'sea', tw2: 'sea', vn2: 'sea',
};

const SOLO = 420;
const REMAKE_SEC = 180;

/* ---------------- LRU cache ---------------- */
type CacheEntry = { data: any; exp: number };
const MATCH_CACHE = new Map<string, CacheEntry>();
const MATCH_TTL_MS = 60 * 60 * 1000; // 1h TTL

function cacheGet(id: string) {
  const e = MATCH_CACHE.get(id);
  if (!e) return null;
  if (e.exp < Date.now()) { MATCH_CACHE.delete(id); return null; }
  MATCH_CACHE.delete(id); MATCH_CACHE.set(id, e); // refresh LRU
  return e.data;
}
function cacheSet(id: string, data: any) {
  MATCH_CACHE.set(id, { data, exp: Date.now() + MATCH_TTL_MS });
  if (MATCH_CACHE.size > 1000) {
    const iter = MATCH_CACHE.keys().next();
    if (!iter.done) MATCH_CACHE.delete(iter.value);
  }
}

/* ---------------- helpers ---------------- */
function requirePlatform(input: string): { platform: string; region: Region } {
  const key = (input || '').trim().toLowerCase();
  const platform = (ALIAS_TO_PLATFORM[key] || key).trim();
  const region = PLATFORM_TO_REGION[platform];
  if (!platform || !region) {
    throw new Error(`Unknown/unsupported server "${input}"`);
  }
  return { platform, region };
}

async function riotFetch(url: string, init?: RequestInit, retries = 2): Promise<Response> {
  let attempt = 0;
  while (true) {
    const res = await fetch(url, { ...init, headers: { ...(init?.headers || {}), ...BASE_HEADERS }, cache: 'no-store' });
    if (res.ok) return res;
    if ((res.status === 429 || res.status >= 500) && attempt < retries) {
      const ra = Number(res.headers.get('retry-after') || 0);
      const backoff = ra ? ra * 1000 : 300 + 300 * attempt;
      await new Promise(r => setTimeout(r, backoff));
      attempt++;
      continue;
    }
    return res;
  }
}
async function safeText(res: Response) { try { return await res.text(); } catch { return ''; } }

type ResolveOk = { ok: true; puuid: string };
type ResolveErr = { ok: false; status: number; error: string };
type ResolveResp = ResolveOk | ResolveErr;

async function resolveAccount(region: Region, riotId: string): Promise<ResolveResp> {
  const [gameName, tagLine] = riotId.split('#');
  if (!gameName || !tagLine) {
    return { ok: false, status: 400, error: 'riotId must be GameName#TAG' };
  }
  const res = await riotFetch(
    `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
  );
  if (!res.ok) {
    return { ok: false, status: res.status, error: await safeText(res) };
  }
  const j = await res.json();
  return { ok: true, puuid: j.puuid as string };
}

async function fetchIds(
  region: Region,
  puuid: string,
  { pageStart = 0, step = 100, maxIds = 200, queue }: { pageStart?: number; step?: number; maxIds?: number; queue?: number } = {}
) {
  const ids: string[] = [];
  let start = pageStart;
  while (ids.length < maxIds) {
    const u = new URL(`https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids`);
    u.searchParams.set('start', String(start));
    u.searchParams.set('count', String(step));
    if (queue) u.searchParams.set('queue', String(queue));
    const r = await riotFetch(u.toString());
    if (!r.ok) break;
    const batch = (await r.json()) as string[];
    if (!batch.length) break;
    ids.push(...batch);
    if (batch.length < step) break;
    start += step;
  }
  return ids.slice(0, maxIds);
}

async function fetchMatch(region: Region, matchId: string) {
  const hit = cacheGet(matchId);
  if (hit) return hit;
  const r = await riotFetch(`https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}`);
  if (!r.ok) return null;
  const j = await r.json();
  cacheSet(matchId, j);
  return j;
}

async function fetchDetails(region: Region, ids: string[], concurrency = 3) {
  const out: (any | null)[] = Array(ids.length).fill(null);
  let i = 0;
  async function worker() {
    while (i < ids.length) {
      const idx = i++;
      const id = ids[idx];
      try { out[idx] = await fetchMatch(region, id); }
      catch { out[idx] = null; }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return out;
}

/* ---------------- route ---------------- */
export async function GET(req: Request) {
  try {
    if (!RIOT_KEY) return NextResponse.json({ error: 'Missing RIOT_API_KEY' }, { status: 500 });

    const { searchParams } = new URL(req.url);
    const serverRaw = (searchParams.get('server') || '').trim().toLowerCase();
    const riotId = (searchParams.get('riotId') || '').trim();
    let puuid = (searchParams.get('puuid') || '').trim();

    const historyCount = Math.max(1, Math.min(20, Number(searchParams.get('count') || 10)));
    const maxIds = Math.max(historyCount, Math.min(200, Number(searchParams.get('maxIds') || 60)));
    const detailsConcurrency = Math.max(1, Math.min(3, Number(searchParams.get('concurrency') || 3)));

    const startMs = Number(searchParams.get('startMs') || 0) || 0;
    const endMs = Number(searchParams.get('endMs') || 0) || 0;

    // ✅ platform/region
    let plat: string;
    let reg: Region;
    try {
      ({ platform: plat, region: reg } = requirePlatform(serverRaw));
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }

    // Resolve puuid if needed
    if (!puuid) {
      if (!riotId) return NextResponse.json({ error: 'Provide puuid or riotId' }, { status: 400 });
      console.log("resolveAccount input riotId=", JSON.stringify(riotId));

      const acc = await resolveAccount(reg, riotId);
      if (!acc.ok) {
        return NextResponse.json({ error: 'Account lookup failed', detail: acc.error }, { status: acc.status || 500 });
      }
      puuid = acc.puuid;
    }

    // -------- Fetch SoloQ matches --------
    const want = historyCount;
    const step = 20;
    let start = 0;
    const solo: any[] = [];

    while (solo.length < want && start < maxIds) {
      const idsPage = await fetchIds(reg, puuid, { pageStart: start, step, maxIds: step, queue: SOLO });
      if (!idsPage.length) break;

      const details = (await fetchDetails(reg, idsPage, detailsConcurrency)).filter(Boolean) as any[];

      for (const m of details) {
        const info = m?.info;
        if (!info) continue;
        if (info.queueId !== SOLO || Number(info.gameDuration) < REMAKE_SEC) continue;

        const ts = info.gameStartTimestamp ?? info.gameCreation ?? info.gameEndTimestamp;
        if (startMs && ts && ts < startMs) continue;
        if (endMs && ts && ts >= endMs) continue;

        solo.push(m);
        if (solo.length >= want) break;
      }
      start += step;
    }

    const matches = solo.slice(0, want);

    // Aggregates
    type Agg = { championId: number; championName: string; games: number; wins: number; k: number; d: number; a: number; cs: number; };
    const by: Record<number, Agg> = {};
    for (const m of matches) {
      const me = (m.info.participants || []).find((x: any) => x.puuid === puuid);
      if (!me) continue;
      const id = me.championId as number;
      const name = me.championName ?? '—';
      by[id] ??= { championId: id, championName: name, games: 0, wins: 0, k: 0, d: 0, a: 0, cs: 0 };
      const s = by[id];
      s.games++; if (me.win) s.wins++;
      s.k += me.kills ?? 0; s.d += me.deaths ?? 0; s.a += me.assists ?? 0;
      s.cs += (me.totalMinionsKilled ?? 0) + (me.neutralMinionsKilled ?? 0);
    }

    const round = (n: number, d = 2) => { const f = Math.pow(10, d); return Math.round(n * f) / f; };
    const aggregates = Object.values(by)
      .map(s => ({
        championId: s.championId,
        championName: s.championName,
        games: s.games,
        winrate: round(100 * (s.wins / Math.max(1, s.games)), 1),
        kda: round((s.k + s.a) / Math.max(1, s.d), 2),
        k: round(s.k / Math.max(1, s.games), 1),
        d: round(s.d / Math.max(1, s.games), 1),
        a: round(s.a / Math.max(1, s.games), 1),
        cs: round(s.cs / Math.max(1, s.games), 1),
      }))
      .sort((a, b) => b.games - a.games);

    return NextResponse.json({
      puuid,
      platform: plat,
      region: reg,
      split: { startMs: startMs || null, endMs: endMs || null },
      matches,
      aggregates,
      totalSolo: solo.length,
      fetchedIds: Math.min(start, maxIds),
    });
  } catch (e: any) {
    console.error('summary error', e?.message || e);
    return NextResponse.json({ error: 'Unexpected error', detail: String(e?.message || e) }, { status: 500 });
  }
}
