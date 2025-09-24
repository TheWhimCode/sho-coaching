// src/app/api/riot/resolve/route.ts
import { NextRequest, NextResponse } from 'next/server';

const RIOT_KEY = process.env.RIOT_API_KEY!;
const BASE_HEADERS = { 'X-Riot-Token': RIOT_KEY };

type Region = 'americas' | 'europe' | 'asia' | 'sea';

// Normalize common aliases → platform code Riot expects
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

function normalizePlatform(input: string): { platform?: string; region?: Region } {
  const key = (input || '').trim().toLowerCase();
  const platform = ALIAS_TO_PLATFORM[key] || key || undefined;
  const region = platform ? PLATFORM_TO_REGION[platform] : undefined;
  return { platform, region };
}

function parseRiotTag(tag: string): { gameName: string; tagLine: string } {
  const s = (tag || '').trim();
  const i = s.lastIndexOf('#');
  if (i <= 0 || i === s.length - 1) {
    throw new Error('riotTag must be in format "GameName#TAG".');
  }
  const gameName = s.slice(0, i);
  const tagLine = s.slice(i + 1);
  return { gameName, tagLine };
}

async function riotFetch(url: string, init?: RequestInit, retries = 2): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      ...init,
      headers: { ...(init?.headers || {}), ...BASE_HEADERS },
      cache: 'no-store',
    });
    if (res.ok) return res;
    if ((res.status === 429 || res.status >= 500) && attempt < retries) {
      const jitter = 200 + Math.random() * 400;
      await new Promise((r) => setTimeout(r, jitter * (attempt + 1)));
      continue;
    }
    return res;
  }
}

type Account = { puuid: string; gameName: string; tagLine: string };
type Summoner = { id: string; accountId: string; puuid: string; name: string };

export async function POST(req: NextRequest) {
  try {
    if (!RIOT_KEY) {
      return NextResponse.json({ error: 'Missing RIOT_API_KEY' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const riotTag = String(body?.riotTag || '');
    const server = String(body?.server || '');

    if (!riotTag || !server) {
      return NextResponse.json({ error: 'riotTag and server are required' }, { status: 400 });
    }

    // Validate + normalize
    const { gameName, tagLine } = parseRiotTag(riotTag);
    const { platform: hintedPlatform, region: hintedRegion } = normalizePlatform(server);
    if (!hintedPlatform || !hintedRegion) {
      return NextResponse.json({ error: `Unknown/unsupported server "${server}"` }, { status: 400 });
    }

    // 1) Resolve Riot Account (Account-V1 is on regional cluster)
    const acctRes = await riotFetch(
      `https://${hintedRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
        gameName,
      )}/${encodeURIComponent(tagLine)}`,
    );
    if (!acctRes.ok) {
      const detail = await acctRes.text().catch(() => '');
      const msg =
        acctRes.status === 404
          ? 'No Riot account with that RiotTag.'
          : `Account lookup failed (${acctRes.status}).`;
      return NextResponse.json({ error: msg, detail }, { status: acctRes.status });
    }
    const acct = (await acctRes.json()) as Account;
    const puuid = acct.puuid;

    // 2) Probe Summoner across platforms (Summoner-V4 is on platform/shard)
    // Try hinted platform first, then others.
    const platformOrder = [
      hintedPlatform,
      // Europe
      'euw1', 'eun1', 'tr1', 'ru',
      // Americas
      'na1', 'br1', 'la1', 'la2', 'oc1',
      // Asia
      'kr', 'jp1',
      // SEA
      'ph2', 'sg2', 'th2', 'tw2', 'vn2',
    ].filter((v, i, a) => !!v && a.indexOf(v) === i);

    const attempts: { platform: string; status: number }[] = [];
    let found: { platform: string; summoner: Summoner } | null = null;

    for (const p of platformOrder) {
      const r = await riotFetch(
        `https://${p}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`,
      );
      attempts.push({ platform: p, status: r.status });
      if (r.ok) {
        const s = (await r.json()) as Summoner;
        found = { platform: p, summoner: s };
        break;
      }
      // 404 means "not on this shard", keep probing
      if (r.status === 404) continue;
      // Other status (403/429/5xx) — keep trying others anyway
    }

    if (!found) {
      return NextResponse.json(
        {
          error: 'No League summoner found for this Riot account.',
          puuid,
          triedServers: attempts,
          hint:
            'If this player recently changed region or only played TFT/VALORANT, LoL summoner may not exist on the hinted shard. Double-check server and RiotTag.',
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      puuid,
      server: found.platform,
      summonerId: found.summoner.id,
      riotName: found.summoner.name,
      riotTag,
      triedServers: attempts,
    });
  } catch (err: any) {
    console.error('resolve error:', err?.message ?? err);
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
