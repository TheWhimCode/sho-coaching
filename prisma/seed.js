// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


function startOfToday() { const d = new Date(); d.setHours(0,0,0,0); return d; }
function addDays(d, n)  { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function utcDate(y,m,d,h,mi){ return new Date(Date.UTC(y, m, d, h, mi, 0, 0)); }

for (let d = 0; d < 7; d++) {
  const base = new Date(); base.setUTCHours(0,0,0,0); base.setUTCDate(base.getUTCDate()+d);
  for (let m = 13*60; m <= 23*60+45; m += 15) {
    const dt = utcDate(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), Math.floor(m/60), m%60);
    await prisma.slot.upsert({ where: { startTime: dt }, update:{}, create:{ startTime: dt, duration: 15 }});
  }
}
async function main() {
  const base0 = startOfToday();

  let count = 0;
  for (let d = 0; d < 7; d++) {
    const base = addDays(base0, d);
    for (let m = 13 * 60; m <= 23 * 60 + 45; m += 15) {
      const dt = new Date(base);
      dt.setHours(Math.floor(m / 60), m % 60, 0, 0);

      // relies on @@unique([startTime]) in Slot
      await prisma.slot.upsert({
        where: { startTime: dt },
        update: {},                       // nothing to change if exists
        create: { startTime: dt, duration: 15 },
      });
      count++;
    }
  }
  console.log(`Seeded/upserted ${count} slots`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
