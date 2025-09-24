// src/app/api/students/repair-summoner/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { probeSummonerEverywhere } from '@/lib/riot';

export async function POST() {
  try {
    const students = await prisma.student.findMany({
      where: { summonerId: null, NOT: { puuid: null } },
      select: { id: true, puuid: true },
    });

    const results: Array<{ id: string; ok: boolean; server?: string; message?: string }> = [];

    for (const s of students) {
      try {
        const probed = await probeSummonerEverywhere(s.puuid!);
        if (probed.found) {
          await prisma.student.update({
            where: { id: s.id },
            data: { server: probed.found.server, summonerId: probed.found.id },
          });
          results.push({ id: s.id, ok: true, server: probed.found.server });
        } else {
          results.push({ id: s.id, ok: false, message: 'not found on any platform' });
        }
      } catch (e: any) {
        results.push({ id: s.id, ok: false, message: e?.message ?? 'error' });
      }
    }

    return NextResponse.json({ repairedCount: results.filter(r => r.ok).length, total: results.length, results });
  } catch (err: any) {
    console.error('repair-summoner error:', err);
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
