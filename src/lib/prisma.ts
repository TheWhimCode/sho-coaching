// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { getQueryLabel } from "@/lib/queryContext";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function logPrismaOp(payload: {
  label: string;
  model: string;
  operation: string;
  ms: number;
}) {
  const line = JSON.stringify({ prisma: true, ...payload });
  if (process.env.PRISMA_QUERY_LOGS === "1") {
    console.log(line);
  } else {
    const slow = Number(process.env.PRISMA_LOG_SLOW_MS ?? "100");
    if (payload.ms >= slow) {
      console.warn(line);
    }
  }
}

function createPrismaClient(): PrismaClient {
  const base = new PrismaClient();

  const extended = base.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const label = getQueryLabel() ?? "unlabeled";
          const t0 = Date.now();
          try {
            return await query(args);
          } finally {
            const ms = Date.now() - t0;
            logPrismaOp({ label, model, operation, ms });
          }
        },
      },
      async $queryRaw({ args, query }) {
        const label = getQueryLabel() ?? "unlabeled";
        const t0 = Date.now();
        try {
          return await query(args);
        } finally {
          const ms = Date.now() - t0;
          logPrismaOp({ label, model: "$queryRaw", operation: "execute", ms });
        }
      },
    },
  });

  // Prisma 6: extended client is runtime-compatible with PrismaClient; cast keeps
  // TransactionClient / $on typings working across the codebase.
  return extended as unknown as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
