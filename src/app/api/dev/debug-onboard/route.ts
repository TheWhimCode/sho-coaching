// src/app/api/dev/debug-onboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { accountByRiotTag, parseRiotTag, probeSummonerEverywhere } from '@/lib/riot';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const riotTag = String(body?.riotTag || '').trim();
    const server  = String(body?.server  || '').toLowerCase(); // only a regional hint

    if (!riotTag || !server) {
      return NextResponse.json({ error: 'riotTag and server are required' }, { status: 400 });
    }

    parseRiotTag(riotTag);

    // Riot ID -> PUUID (regional endpoint)
    const acct = await accountByRiotTag(server, riotTag);

    // Probe all platforms to find the *actual* Summoner host + id
    const probed = await probeSummonerEverywhere(acct.puuid);

    if (!probed.found) {
      return NextResponse.json(
        { acct, found: null, triedServers: probed.attempts, hint: 'No summoner found on any platform for this PUUID.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ acct, summ: probed.found, triedServers: probed.attempts });
  } catch (err: any) {
    console.error('debug-onboard error:', err);
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
