import { prisma } from "@/lib/prisma";
import { getRunesDailyChampion } from "@/lib/skillcheck/runesDailyChampion";
import { sampleKeystoneForChampion } from "@/lib/skillcheck/keystoneSampling";

export type EnsureRuneDailyResult =
  | { action: "skipped"; dayKey: string; championId: string; keystoneId: number; message: string }
  | { action: "failed"; dayKey: string; championId: string; error: string; logLines: number }
  | { action: "computed"; dayKey: string; championId: string; keystoneId: number; sampleSize: number; logLines: number };

/**
 * Ensure RuneDaily exists for the given dayKey. If not, sample master+ via Riot and save.
 * Logs each step for debugging rate limits / failures.
 */
export async function ensureRuneDailyForDay(dayKey: string): Promise<EnsureRuneDailyResult> {
  const existing = await prisma.runeDaily.findUnique({
    where: { dayKey },
  });
  // Skip only when we have a valid keystone (previous run succeeded)
  if (existing && existing.keystoneId > 0) {
    return {
      action: "skipped",
      dayKey,
      championId: existing.championId,
      keystoneId: existing.keystoneId,
      message: "RuneDaily already exists",
    };
  }

  const championId = getRunesDailyChampion(dayKey);
  console.log(`[skillcheck:runes] sampling keystone for dayKey=${dayKey} champion=${championId}`);

  const result = await sampleKeystoneForChampion(championId);

  if ("error" in result) {
    const errorLog = result.log.join("\n");
    console.error(`[skillcheck:runes] sampling failed`, { dayKey, championId, error: result.error, log: errorLog });
    await prisma.runeDaily.upsert({
      where: { dayKey },
      create: {
        dayKey,
        championId,
        keystoneId: 0,
        errorLog: `${result.error}\n${errorLog}`,
      },
      update: {
        championId,
        keystoneId: 0,
        errorLog: `${result.error}\n${errorLog}`,
        updatedAt: new Date(),
      },
    });
    return {
      action: "failed",
      dayKey,
      championId,
      error: result.error,
      logLines: result.log.length,
    };
  }

  const logTail = result.log.slice(-5).join("; ");
  console.log(`[skillcheck:runes] success`, { dayKey, championId, keystoneId: result.keystoneId, sampleSize: result.sampleSize, logTail });

  await prisma.runeDaily.upsert({
    where: { dayKey },
    create: {
      dayKey,
      championId,
      keystoneId: result.keystoneId,
      sampledAt: new Date(),
      errorLog: null,
    },
    update: {
      championId,
      keystoneId: result.keystoneId,
      sampledAt: new Date(),
      errorLog: null,
      updatedAt: new Date(),
    },
  });

  return {
    action: "computed",
    dayKey,
    championId,
    keystoneId: result.keystoneId,
    sampleSize: result.sampleSize,
    logLines: result.log.length,
  };
}
