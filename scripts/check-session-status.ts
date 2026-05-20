import { config } from "dotenv";
config({ path: ".env.local" });
import { prisma } from "../src/lib/prisma";

const ref = process.argv[2] ?? "pi_3TZ9kY2WdBgyxJBV0oWIRoq5";

async function main() {
  const s = await prisma.session.findFirst({
    where: { paymentRef: ref },
    select: {
      id: true,
      status: true,
      paymentRef: true,
      amountCents: true,
      couponCode: true,
      couponDiscount: true,
      sessionType: true,
      riotTag: true,
      slotId: true,
      blockCsv: true,
    },
  });
  console.log(JSON.stringify(s, null, 2));

  const ev = await prisma.processedEvent.findMany({
    where: { id: { contains: "TZ9kY" } },
    take: 5,
  });
  console.log("processedEvents (sample):", ev);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
