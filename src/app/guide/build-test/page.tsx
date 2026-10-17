import { notFound } from "next/navigation";
import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { champSquareUrlById, resolveChampionId } from "@/lib/datadragon/champions";
import { ensureLiveDDragonPatch } from "@/lib/datadragon/patch";
import { ensureSummonerSpellsAssets, summonerSpellIconById, summonerSpellKeyById } from "@/lib/datadragon/summonerspells";
import { loadPickerBoots, loadPickerBuilds } from "@/lib/guides/buildPicker/loadBuilds";
import { VIEGO_ITEM_SECTION } from "../viegoItems";
import Playground from "./Playground";
import { buildGuideTextIcons } from "@/lib/guides/buildGuideTextIcons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Temporary build scoring test", robots: { index: false, follow: false } };

// Approximate role pools for plausible test compositions, not role inference.
const POOLS = [
  ["Aatrox", "Camille", "Cho'Gath", "Darius", "Fiora", "Garen", "Gnar", "Gwen", "Illaoi", "Jax", "K'Sante", "Kayle", "Kennen", "Malphite", "Mordekaiser", "Ornn", "Renekton", "Riven", "Sett", "Shen", "Sion", "Teemo", "Yorick"],
  ["Amumu", "Briar", "Diana", "Ekko", "Elise", "Evelynn", "Graves", "Hecarim", "Ivern", "Jarvan IV", "Kayn", "Kha'Zix", "Kindred", "Lee Sin", "Lillia", "Master Yi", "Nocturne", "Nunu & Willump", "Rengar", "Sejuani", "Shaco", "Talon", "Vi", "Zac"],
  ["Ahri", "Akali", "Anivia", "Annie", "Aurelion Sol", "Aurora", "Azir", "Cassiopeia", "Galio", "Hwei", "Kassadin", "Katarina", "LeBlanc", "Lux", "Malzahar", "Orianna", "Ryze", "Swain", "Sylas", "Syndra", "Veigar", "Viktor", "Yasuo", "Yone", "Zed"],
  ["Aphelios", "Ashe", "Caitlyn", "Corki", "Draven", "Ezreal", "Jhin", "Jinx", "Kai'Sa", "Kalista", "Kog'Maw", "Lucian", "Miss Fortune", "Nilah", "Samira", "Sivir", "Smolder", "Tristana", "Twitch", "Varus", "Vayne", "Xayah", "Yunara", "Zeri"],
  ["Alistar", "Bard", "Blitzcrank", "Brand", "Braum", "Janna", "Karma", "Leona", "Lulu", "Lux", "Milio", "Morgana", "Nami", "Nautilus", "Pyke", "Rakan", "Rell", "Renata Glasc", "Senna", "Seraphine", "Sona", "Soraka", "Swain", "Tahm Kench", "Taric", "Thresh", "Yuumi", "Zilean"],
];

export default async function BuildTestPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  await Promise.all([ensureLiveDDragonPatch(), ensureSummonerSpellsAssets()]);
  const [profiles, builds, bootItems, guideTextIcons] = await Promise.all([
    prisma.championProfile.findMany(), loadPickerBuilds(VIEGO_ITEM_SECTION), loadPickerBoots(),
    buildGuideTextIcons(),
  ]);
  const byName = new Map(profiles.map(row => [row.name, row]));
  const used = new Set(["Viego"]);
  const pick = (pool: string[]) => {
    const available = pool.filter(name => byName.has(name) && !used.has(name));
    const name = available[randomInt(available.length)];
    used.add(name);
    return name;
  };
  const makeTeam = (ally: boolean) => POOLS.map((pool, role) => {
    const name = ally && role === 1 ? "Viego" : pick(pool);
    const row = byName.get(name)!;
    if (row.durabilityScore === null || row.shieldScore === null || row.damageScore === null) throw new Error(`Missing score for ${name}`);
    const championId = resolveChampionId(name);
    const spellIds = [4, role === 1 ? 11 : role === 0 ? 12 : role === 3 ? 21 : 14];
    return {
      name, championId, shields: row.shields,
      durabilityScore: row.durabilityScore, shieldScore: row.shieldScore,
      shieldTiming: row.shieldTiming, canBuildSteelcaps: row.canBuildSteelcaps,
      damageType: row.damageType, damageThreat: row.damageThreat, damageScore: row.damageScore,
      cc: row.cc, ccScore: row.ccScore, mercuryTreadsScore: row.mercuryTreadsScore,
      deniesResets: row.deniesResets, spellIds,
      championName: name, championIcon: champSquareUrlById(championId),
      isSearchedPlayer: ally && role === 1,
      spells: spellIds.map(id => ({ id, key: summonerSpellKeyById(id) ?? String(id), icon: summonerSpellIconById(id) ?? "" })),
    };
  });
  const allies = makeTeam(true);
  const enemies = makeTeam(false);
  return <Playground allies={allies} enemies={enemies} builds={builds} bootItems={bootItems} guideTextIcons={guideTextIcons} />;
}
