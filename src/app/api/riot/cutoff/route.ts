// app/api/gm-chall-cutoffs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { riotFetchJSON } from '@/lib/riot/fetch';

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

    if (!process.env.RIOT_API_KEY) {
      return NextResponse.json(
        { error: 'RIOT_API_KEY missing on server' },
        { status: 500 }
      );
    }

    const base = `https://${platform}.api.riotgames.com/lol/league/v4`;

    let gmJson: RiotLeagueResponse;
    let chJson: RiotLeagueResponse;
    try {
      [gmJson, chJson] = (await Promise.all([
        riotFetchJSON<RiotLeagueResponse>(
          `${base}/grandmasterleagues/by-queue/${encodeURIComponent(queue)}`
        ),
        riotFetchJSON<RiotLeagueResponse>(
          `${base}/challengerleagues/by-queue/${encodeURIComponent(queue)}`
        ),
      ])) as [RiotLeagueResponse, RiotLeagueResponse];
    } catch {
      return NextResponse.json(
        { error: 'Failed to fetch ladder(s) from Riot' },
        { status: 502 }
      );
    }

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
