// app/api/gm-chall-cutoffs/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 300; // cache for 5 minutes (ISR)

type RiotLeagueEntry = {
  summonerId: string;
  summonerName: string;
  leaguePoints: number;
  // ...other fields
};

type RiotLeagueResponse = {
  tier: 'GRANDMASTER' | 'CHALLENGER';
  queue: string;
  name: string;
  leagueId: string;
  entries: RiotLeagueEntry[];
};

const DEFAULT_PLATFORM = 'EUW1';
const DEFAULT_QUEUE = 'RANKED_SOLO_5x5';

function minLP(entries: RiotLeagueEntry[]): number | null {
  if (!entries?.length) return null;
  let min = Infinity;
  for (const e of entries) {
    if (typeof e.leaguePoints === 'number' && e.leaguePoints < min) min = e.leaguePoints;
  }
  return Number.isFinite(min) ? min : null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = (searchParams.get('platform') || DEFAULT_PLATFORM).toUpperCase();
    const queue = searchParams.get('queue') || DEFAULT_QUEUE;

    const apiKey = process.env.RIOT_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'RIOT_API_KEY missing on server' },
        { status: 500 }
      );
    }

    const base = `https://${platform}.api.riotgames.com/lol/league/v4`;
    const headers = { 'X-Riot-Token': apiKey };

    const [gmRes, chRes] = await Promise.all([
      fetch(`${base}/grandmasterleagues/by-queue/${queue}`, { headers, next: { revalidate } }),
      fetch(`${base}/challengerleagues/by-queue/${queue}`,   { headers, next: { revalidate } }),
    ]);

    if (!gmRes.ok || !chRes.ok) {
      const detail = {
        grandmasterStatus: gmRes.status,
        challengerStatus: chRes.status,
      };
      return NextResponse.json(
        { error: 'Failed to fetch ladder(s) from Riot', detail },
        { status: 502 }
      );
    }

    const [gmJson, chJson] = (await Promise.all([
      gmRes.json(),
      chRes.json(),
    ])) as [RiotLeagueResponse, RiotLeagueResponse];

    const gmCutoffLP = minLP(gmJson.entries);
    const challengerCutoffLP = minLP(chJson.entries);

    return NextResponse.json({
      platform,
      queue,
      gmCutoffLP,              // LP above MASTER_BASE (fits your labelWithCutoffs)
      challengerCutoffLP,      // LP above MASTER_BASE
      counts: {
        grandmaster: gmJson.entries?.length ?? 0,
        challenger: chJson.entries?.length ?? 0,
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Unexpected server error', detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
