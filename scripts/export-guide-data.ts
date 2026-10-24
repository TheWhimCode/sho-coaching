import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { mkdir, writeFile } from 'node:fs/promises';
config({ path: '.env.local', quiet: true });
config({ path: '.env', quiet: true });
async function main() {
  const db = new PrismaClient();
  try {
    const [profiles, status] = await Promise.all([
      db.championProfile.findMany({ orderBy: { name: 'asc' } }),
      db.siteConfig.findUnique({ where: { id: 'default' }, select: { twitchLiveManual: true, twitchStreamTitle: true } }),
    ]);
    if (!profiles.length) throw new Error('Refusing to export an empty champion catalog');
    const directory = 'src/data/guide';
    await mkdir(directory, { recursive: true });
    await writeFile(`${directory}/champion-profiles.json`, JSON.stringify(profiles.map(({ updatedAt, ...profile }) => profile), null, 2) + '\n');
    await writeFile(`${directory}/twitch-status.json`, JSON.stringify({ isLive: status?.twitchLiveManual ?? false, title: status?.twitchStreamTitle?.trim() || undefined }, null, 2) + '\n');
    console.log(`Exported ${profiles.length} public champion profiles and Twitch status. No database writes.`);
  } finally { await db.$disconnect(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
