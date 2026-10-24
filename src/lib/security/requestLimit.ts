import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { RequestLimitError } from "./requestLimitShared";
export { RequestLimitError, visitorBucket } from "./requestLimitShared";

/** Atomic counter shared by all instances; database failures reject the request. */
export function createRequestLimiter(database: Pick<Prisma.TransactionClient, "$queryRaw">) {
  const blockedUntil = new Map<string, number>();
  return async function enforce(key: string, limit: number, windowMs: number): Promise<void> {
    const blocked = blockedUntil.get(key) ?? 0;
    if (blocked > Date.now()) throw new RequestLimitError(Math.ceil((blocked - Date.now()) / 1000));
    blockedUntil.delete(key);
    const rows = await database.$queryRaw<{ count: number; retryAfter: number }[]>`
      INSERT INTO "public"."RequestLimit" ("key", "count", "expiresAt")
      VALUES (${key}, 1, clock_timestamp() + ${windowMs} * interval '1 millisecond')
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RequestLimit"."expiresAt" <= clock_timestamp() THEN 1
          ELSE LEAST("RequestLimit"."count" + 1, ${limit + 1}) END,
        "expiresAt" = CASE WHEN "RequestLimit"."expiresAt" <= clock_timestamp()
          THEN clock_timestamp() + ${windowMs} * interval '1 millisecond'
          ELSE "RequestLimit"."expiresAt" END
      RETURNING "count", GREATEST(1, CEIL(EXTRACT(EPOCH FROM ("expiresAt" - clock_timestamp()))))::integer AS "retryAfter"
    `;
    if (!rows[0] || rows[0].count > limit) {
      const retryAfter = rows[0]?.retryAfter ?? Math.ceil(windowMs / 1000);
      if (blockedUntil.size >= 4096) blockedUntil.delete(blockedUntil.keys().next().value!);
      blockedUntil.set(key, Date.now() + retryAfter * 1000);
      throw new RequestLimitError(retryAfter);
    }
  };
}

export const enforceRequestLimit = createRequestLimiter(prisma);
