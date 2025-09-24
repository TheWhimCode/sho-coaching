import 'dotenv/config';
import { prisma } from '@/lib/prisma';
import { probeSummonerEverywhere } from '@/lib/riot';

async function main() {
  const students = await prisma.student.findMany({
    where: { puuid: { not: null }, summonerId: null },
  });
  console.log(`Backfilling ${students.length} students...`);

  for (const s of students) {
    if (!s.puuid) { console.log(`skip ${s.name}: no puuid`); continue; }

    try {
      const res = await probeSummonerEverywhere(s.puuid);
      if (!res.found) {
        console.log(`no LoL summoner for ${s.name}; tried:`, res.attempts.slice(0,6));
        continue;
      }
      await prisma.student.update({
        where: { id: s.id },
        data: { server: res.found.server, summonerId: res.found.id },
      });
      console.log(`ok ${s.name}: server=${res.found.server}, summonerId=${res.found.id.slice(0,6)}…`);
    } catch (e) {
      const msg = (e as any)?.message ?? String(e);
      console.error(`err ${s.name}:`, msg);
    }
  }
}

main().then(()=>process.exit(0)).catch(e=>{ console.error(e); process.exit(1); });
