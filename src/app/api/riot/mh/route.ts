import { NextResponse } from 'next/server';
const RIOT_KEY = process.env.RIOT_API_KEY!;

const ALIAS_TO_PLATFORM: Record<string, string> = {
  euw:'euw1', eu:'euw1', euw1:'euw1',
  eune:'eun1', eun:'eun1', eun1:'eun1', eune1:'eun1',
  na:'na1', na1:'na1',
  oce:'oc1', oc1:'oc1',
  lan:'la1', la1:'la1',
  las:'la2', la2:'la2',
  br:'br1', br1:'br1',
  tr:'tr1', tr1:'tr1',
  ru:'ru',
  kr:'kr',
  jp:'jp1', jp1:'jp1',
  ph:'ph2', ph2:'ph2',
  sg:'sg2', sg2:'sg2',
  th:'th2', th2:'th2',
  tw:'tw2', tw2:'tw2',
  vn:'vn2', vn2:'vn2',
};

const PLATFORM_TO_REGION: Record<string, 'americas'|'europe'|'asia'|'sea'> = {
  na1:'americas', br1:'americas', la1:'americas', la2:'americas', oc1:'americas',
  euw1:'europe', eun1:'europe', tr1:'europe', ru:'europe',
  kr:'asia', jp1:'asia',
  ph2:'sea', sg2:'sea', th2:'sea', tw2:'sea', vn2:'sea',
};

// SoloQ only
const SOLO_QUEUE = 420;

// === Simple in-memory PUUID cache (per server process) ===
type CacheVal = { puuid: string; exp: number };
const PUUID_CACHE = new Map<string, CacheVal>();
const PUUID_TTL_MS = 6 * 60 * 60 * 1000; // 6h
const puuidKey = (region: string, game: string, tag: string) =>
  `${region}:${game.toLowerCase()}#${tag.toLowerCase()}`;

// Riot fetch with tiny retry/backoff on 429/5xx
async function riotFetch(url: string, init?: RequestInit, retries = 2): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      ...init,
      headers: { ...(init?.headers || {}), 'X-Riot-Token': RIOT_KEY },
    });
    if (res.ok) return res;
    if ((res.status === 429 || res.status >= 500) && attempt < retries) {
      const jitter = 200 + Math.random() * 400;
      await new Promise(r => setTimeout(r, jitter * (attempt + 1)));
      continue;
    }
    return res;
  }
}

function toNum(v: string | null): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function round(n: number, d = 2) {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}
async function safeText(res: Response) { try { return await res.text(); } catch { return ''; } }

async function fetchIdsInRange(opts: {
  region: 'americas'|'europe'|'asia'|'sea',
  puuid: string,
  startTime: number,
  endTime: number,
  maxIds: number
}) {
  // IMPORTANT: no queue here — we’ll filter details to SoloQ (420) later.
  const { region, puuid, startTime, endTime, maxIds } = opts;
  const ids: string[] = [];
  let start = 0;
  const step = 100;

  while (ids.length < maxIds) {
    const u = new URL(`https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids`);
    u.searchParams.set('start', String(start));
    u.searchParams.set('count', String(step));
    u.searchParams.set('startTime', String(startTime));
    u.searchParams.set('endTime', String(endTime));

    const res = await riotFetch(u.toString());
    if (!res.ok) break;
    const batch = (await res.json()) as string[];
    if (!batch.length) break;
    ids.push(...batch);
    if (batch.length < step) break;
    start += step;
  }

  return ids.slice(0, maxIds);
}

async function fetchMatchDetails(region: string, ids: string[]) {
  const CONCURRENCY = 8;
  const out: any[] = [];
  let i = 0;
  async function worker() {
    while (i < ids.length) {
      const idx = i++;
      const id = ids[idx];
      try {
        const r = await riotFetch(`https://${region}.api.riotgames.com/lol/match/v5/matches/${id}`);
        out[idx] = r.ok ? await r.json() : null;
      } catch {
        out[idx] = null;
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker as any));
  return out;
}

export async function GET(req: Request) {
  try {
    if (!RIOT_KEY) return NextResponse.json({ error: 'Missing RIOT_API_KEY' }, { status: 500 });

    const { searchParams } = new URL(req.url);
    const riotId = (searchParams.get('riotId') || '').trim();   // "Game#TAG" (optional if puuid provided)
    const puuidParam = (searchParams.get('puuid') || '').trim(); // optional to skip resolve
    const serverRaw = (searchParams.get('server') || '').trim().toLowerCase();
    const mode = (searchParams.get('mode') || 'history').toLowerCase(); // 'history' | 'stats'

    // history params
    const count = Math.max(1, Math.min(20, Number(searchParams.get('count') || 10)));
    const includeNormals = searchParams.get('includeNormals') === '1';
    const historyMaxIds = Math.max(100, Math.min(1000, toNum(searchParams.get('maxIds')) ?? 800)); // cap

    // stats params
    const nowSec = Math.floor(Date.now() / 1000);
    const startTime = toNum(searchParams.get('startTime'));
    const endTime = toNum(searchParams.get('endTime')) ?? nowSec;
    const skipRemakesUnderSec = Math.max(0, toNum(searchParams.get('skipRemakesUnderSec')) ?? 180);
    const statsMaxIds = Math.max(100, Math.min(2000, toNum(searchParams.get('maxIds')) ?? 1200));

    // normalize platform/region
    const platform = ALIAS_TO_PLATFORM[serverRaw] || serverRaw;
    const region = PLATFORM_TO_REGION[platform];
    if (!region) return NextResponse.json({ error: `Unknown/unsupported server "${serverRaw}"` }, { status: 400 });

    // resolve PUUID unless provided
    let puuid = puuidParam;
    if (!puuid) {
      const [gameName, tagLine] = riotId.split('#');
      if (!gameName || !tagLine) {
        return NextResponse.json({ error: 'riotId must be GameName#TAG or provide puuid' }, { status: 400 });
      }
      const ck = puuidKey(region, gameName, tagLine);
      const cached = PUUID_CACHE.get(ck);
      if (cached && cached.exp > Date.now()) {
        puuid = cached.puuid;
      } else {
        const acctRes = await riotFetch(
          `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
        );
        if (!acctRes.ok) {
          return NextResponse.json({ error: 'Failed to resolve account', detail: await safeText(acctRes) }, { status: acctRes.status });
        }
        const acct = (await acctRes.json()) as { puuid: string };
        puuid = acct.puuid;
        PUUID_CACHE.set(ck, { puuid, exp: Date.now() + PUUID_TTL_MS });
      }
    }

    if (mode === 'stats') {
      if (!startTime) return NextResponse.json({ error: 'startTime (unix seconds) is required for stats mode' }, { status: 400 });

      // 1) Get IDs for the time window (no queue param)
      const ids = await fetchIdsInRange({ region, puuid, startTime, endTime, maxIds: statsMaxIds });
      if (ids.length === 0) {
        return NextResponse.json({ puuid, platform, region, aggregates: [], totalGames: 0, range: { startTime, endTime }, queue: SOLO_QUEUE });
      }

      // 2) Fetch details and filter SoloQ only
      const matches = await fetchMatchDetails(region, ids);
      const filtered = (matches.filter(Boolean) as any[]).filter(m => m?.info?.queueId === SOLO_QUEUE);

      // 3) Skip remakes and aggregate by champion
      const parts: any[] = [];
      for (const m of filtered) {
        const info = m.info;
        if (skipRemakesUnderSec && Number(info.gameDuration) < skipRemakesUnderSec) continue;
        const p = (info.participants || []).find((x: any) => x.puuid === puuid);
        if (!p) continue;
        parts.push({
          championId: p.championId,
          championName: p.championName ?? '—',
          win: !!p.win,
          kills: p.kills ?? 0, deaths: p.deaths ?? 0, assists: p.assists ?? 0,
          cs: (p.totalMinionsKilled ?? 0) + (p.neutralMinionsKilled ?? 0),
        });
      }

      const by: Record<number, { championId:number; championName:string; games:number; wins:number; k:number; d:number; a:number; cs:number; }> = {};
      for (const p of parts) {
        const id = p.championId;
        by[id] ??= { championId:id, championName:p.championName, games:0, wins:0, k:0, d:0, a:0, cs:0 };
        const s = by[id];
        s.games++; if (p.win) s.wins++;
        s.k += p.kills; s.d += p.deaths; s.a += p.assists; s.cs += p.cs;
      }

      const aggregates = Object.values(by)
        .map(s => ({
          championId: s.championId,
          championName: s.championName,
          games: s.games,
          winrate: round(100*s.wins/s.games, 1),
          kda: round((s.k+s.a)/Math.max(1,s.d), 2),
          k: round(s.k/s.games, 1),
          d: round(s.d/s.games, 1),
          a: round(s.a/s.games, 1),
          cs: round(s.cs/s.games, 1),
        }))
        .sort((a,b)=>b.games-a.games);

      return NextResponse.json({
        puuid, platform, region,
        aggregates, totalGames: parts.length,
        range: { startTime, endTime },
        queue: SOLO_QUEUE,
      });
    }

    // === mode: history (SoloQ only, accumulate until count) ===
    const WANT = count;
    const step = 100;
    let start = 0;
    let collected: any[] = [];

    while (collected.length < WANT && start < historyMaxIds) {
      const idsRes = await riotFetch(
        `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${step}`
      );
      if (!idsRes.ok) {
        return NextResponse.json({ error: 'Failed to fetch match ids', detail: await safeText(idsRes) }, { status: idsRes.status });
      }
      const batch = (await idsRes.json()) as string[];
      if (!batch.length) break;

      const details = await fetchMatchDetails(region, batch);
      const solo = (details.filter(Boolean) as any[])
        .filter(m => m?.info?.queueId === SOLO_QUEUE)
        .filter(m => Number(m.info?.gameDuration) >= 180); // skip remakes

      collected.push(...solo);
      start += step;
    }

    // If includeNormals === false we already filtered to Solo; keep compatibility
    const matches = collected.slice(0, WANT);

    return NextResponse.json({ puuid, matches, platform, region });

  } catch (e: any) {
    return NextResponse.json({ error: 'Unexpected error', detail: String(e?.message || e) }, { status: 500 });
  }
}
