// src/app/api/students/onboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseRiotTag, accountByRiotTag, probeSummonerEverywhere } from '@/lib/riot';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const name    = String(body?.name || '').trim();
    const riotTag = String(body?.riotTag || '').trim();       // "Game#TAG"
    const server  = String(body?.server || '').toLowerCase(); // hint for regional routing (may be wrong)

    if (!name || !riotTag) {
      return NextResponse.json({ error: 'name and riotTag are required' }, { status: 400 });
    }

    parseRiotTag(riotTag);

    // Riot ID -> puuid (regional; works even if server hint is wrong)
    const acct = await accountByRiotTag(server || 'euw1', riotTag);

    // Find actual platform + summonerId
    const probed = await probeSummonerEverywhere(acct.puuid);
    if (!probed.found) {
      return NextResponse.json(
        { error: 'No League summoner found for this Riot account', puuid: acct.puuid, tried: probed.attempts },
        { status: 404 },
      );
    }

    const { server: trueServer, id: summonerId, name: riotName } = probed.found;

    // Upsert by unique student name
    const student = await prisma.student.upsert({
      where: { name },
      create: {
        name,
        riotTag,
        puuid: acct.puuid,
        server: trueServer,
        summonerId,
      },
      update: {
        riotTag,
        puuid: acct.puuid,
        server: trueServer,
        summonerId,
      },
    });

    return NextResponse.json({
      student,
      resolved: { puuid: acct.puuid, server: trueServer, summonerId, riotName, riotTag },
    });
  } catch (err: any) {
    console.error('onboard error:', err);
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
