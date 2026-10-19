const ARCANE_COMET = 8229;
const DEATHFIRE_TOUCH = 8992;

// Current Data Dragon keystones. A missing/partial rune page keeps base ratings.
const KEYSTONES = new Set([
  8112, 8128, 9923, 8351, 8360, 8369, 8005, 8008, 8021,
  8010, 8437, 8439, 8465, 8214, ARCANE_COMET, 8230, DEATHFIRE_TOUCH,
]);

type RuneScoredChampion = {
  name?: string;
  championId?: string;
  perkIds?: number[];
  ccScore?: number | null;
  mercuryTreadsScore?: number | null;
  damageScore?: number | null;
};

/** Infer Shaco's variant from a real keystone without changing the stored profile. */
export function applyRuneScoreOverrides<T extends RuneScoredChampion>(champion: T): T {
  if (champion.championId !== "Shaco" && champion.name !== "Shaco") return champion;
  const keystone = champion.perkIds?.find(id => KEYSTONES.has(id));
  if (keystone === undefined || keystone === ARCANE_COMET || keystone === DEATHFIRE_TOUCH) return champion;
  return { ...champion, ccScore: 2, mercuryTreadsScore: 1, damageScore: 4 };
}
