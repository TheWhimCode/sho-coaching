// prisma/seed.mjs
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const utc = (y,m,d,h,mi) => new Date(Date.UTC(y,m,d,h,mi,0,0));

async function main() {
  const now = new Date();
  for (let d = 0; d < 7; d++) {
    const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + d));
    for (let m = 13*60; m <= 23*60+45; m += 15) {
      const dt = utc(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), Math.floor(m/60), m%60);
      await prisma.slot.upsert({ where: { startTime: dt }, update: {}, create: { startTime: dt, duration: 15 } });
    }
  }
  console.log('Seeded slots');
}

main().finally(() => prisma.$disconnect());
