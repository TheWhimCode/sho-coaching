// C:\sho-coaching\src\lib\datadragon\championspells.ts

export interface SpellData {
  id: string;
  name: string;
  description: string;
  cooldowns: number[];
  icon: string; // full URL
}

export interface ChampionSpells {
  championId: string;
  spells: SpellData[];
}

const VERSION_URL = "https://ddragon.leagueoflegends.com/api/versions.json";
const CHAMP_URL = (version: string) =>
  `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`;
const CHAMP_DETAIL_URL = (version: string, champ: string) =>
  `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion/${champ}.json`;

async function getLatestVersion(): Promise<string> {
  const res = await fetch(VERSION_URL);
  const versions = await res.json();
  return versions[0];
}

export async function fetchChampionSpells(): Promise<ChampionSpells[]> {
  const version = await getLatestVersion();

  // Get champion list
  const res = await fetch(CHAMP_URL(version));
  const champList = await res.json();
  const champions = Object.keys(champList.data);

  const output: ChampionSpells[] = [];

  for (const champ of champions) {
    const detailRes = await fetch(CHAMP_DETAIL_URL(version, champ));
    const detailJson = await detailRes.json();
    const champData = detailJson.data[champ];

    const spells: SpellData[] = champData.spells.map((spell: any) => ({
      id: spell.id,
      name: spell.name,
      description: spell.description,
      cooldowns: spell.cooldown,
      icon: `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${spell.image.full}`,
    }));

    output.push({
      championId: champ,
      spells,
    });
  }

  return output;
}
