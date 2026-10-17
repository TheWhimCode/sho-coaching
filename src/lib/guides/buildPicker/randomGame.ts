import { compositionFacts } from "./compositionFacts";
import { runDecisionTree, type TreeParticipant } from "./decisionTree";
import { RANDOM_ROLE_POOLS } from "./randomRolePools";
import type { LiveGameLookup, LiveGameParticipant, LiveGameSpell } from "./types";

export type RandomGameCatalog = {
  champions: (Omit<TreeParticipant, "spellIds"> & { championIcon: string })[];
  spells: LiveGameSpell[];
};

/** Runs entirely in the browser using the same decision tree as live lookups. */
export function createRandomGame(catalog: RandomGameCatalog): LiveGameLookup {
  const byName = new Map(catalog.champions.map((champion) => [champion.name, champion]));
  const used = new Set(["Viego"]);
  const makeTeam = (ally: boolean) => RANDOM_ROLE_POOLS.map((pool, role) => {
    const available = pool.filter((name) => byName.has(name) && !used.has(name));
    const name = ally && role === 1 ? "Viego" : available[Math.floor(Math.random() * available.length)];
    const champion = byName.get(name);
    if (!champion) throw new Error("Random game data is incomplete. Please reload the page.");
    used.add(name);
    const spellIds = [4, role === 1 ? 11 : role === 4 ? 7 : role === 3 ? 21 : 12];
    return { ...champion, spellIds, isSearchedPlayer: ally && role === 1 };
  });
  const allies = makeTeam(true);
  const enemies = makeTeam(false);
  const toParticipant = (champion: (typeof allies)[number]): LiveGameParticipant => ({
    championId: champion.championId,
    championName: champion.name,
    championIcon: champion.championIcon,
    spells: champion.spellIds.map((id) => {
      const spell = catalog.spells.find((entry) => entry.id === id);
      if (!spell) throw new Error("Random game spells are unavailable. Please reload the page.");
      return spell;
    }),
    isSearchedPlayer: champion.isSearchedPlayer,
    durabilityScore: champion.durabilityScore,
    damageScore: champion.damageScore,
  });
  return {
    status: "in_game", mock: true, source: "live", riotId: "Viego#DEMO",
    platform: "euw1", queue: "Random composition", gameStartedAt: null, playerSide: "blue",
    blue: allies.map(toParticipant), red: enemies.map(toParticipant),
    recommendation: {
      ...runDecisionTree({ allies, enemies }),
      facts: compositionFacts(allies, enemies),
      missingProfiles: [],
    },
  };
}
