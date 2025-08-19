import { PrismaClient } from "@prisma/client";
// prisma.ts
import { CFG_SERVER } from "@/lib/config.server";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
    datasources: {
      db: {
        url: CFG_SERVER.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
