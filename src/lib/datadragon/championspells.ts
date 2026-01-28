// src/lib/datadragon/championspells.ts

export interface SpellData {
  id: string;
  name: string;
  description: string;
  cooldowns: number[];
  icon: string; // full URL
  key: "Q" | "W" | "E" | "R";
}

export interface ChampionSpells {
  championId: string;
  spells: SpellData[];
}

const VERSION_URL = "https://ddragon.leagueoflegends.com/api/versions.json";
const CHAMP_DETAIL_URL = (version: string, champ: string) =>
  `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion/${champ}.json`;

async function getLatestVersion(): Promise<string> {
  const res = await fetch(VERSION_URL, { next: { revalidate: 60 * 60 } });
  if (!res.ok) throw new Error("Failed to load DDragon versions");
  const versions = await res.json();
  return versions[0];
}

export async function fetchChampionSpellsById(
  championId: string
): Promise<{ version: string; data: ChampionSpells }> {
  const version = await getLatestVersion();

  const res = await fetch(CHAMP_DETAIL_URL(version, championId), {
    // cache in Next.js data cache
    next: { revalidate: 60 * 60 * 24 },
  });
console.log("Fetching champ:", championId);

  if (!res.ok) throw new Error(`Failed to load champ detail: ${championId}`);

  const json = await res.json();
  const champData = json.data[championId];

  const keys: Array<"Q" | "W" | "E" | "R"> = ["Q", "W", "E", "R"];

  const spells: SpellData[] = champData.spells.map((spell: any, i: number) => ({
    id: spell.id,
    name: spell.name,
    description: spell.description,
    cooldowns: spell.cooldown, // e.g. [12,11,10,9,8]
    icon: `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${spell.image.full}`,
    key: keys[i]!,
  }));

  return {
    version,
    data: { championId, spells },
  };
}
