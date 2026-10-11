import type {
  ChampionCcLevel,
  ChampionDamageType,
  ChampionDurability,
  ChampionShieldLevel,
  ChampionThreatLevel,
} from "@prisma/client";
import type { BuildFloatTag, TreeTraceStep } from "./decisionTree";

/** Riot platform shards the picker lets users choose from. Auto keeps the discovery order. */
export const BUILD_PICKER_PLATFORMS = [
  { id: "auto", label: "Auto" },
  { id: "euw1", label: "EUW" },
  { id: "na1", label: "NA" },
  { id: "eun1", label: "EUNE" },
  { id: "oc1", label: "OCE" },
  { id: "br1", label: "BR" },
  { id: "la1", label: "LAN" },
  { id: "la2", label: "LAS" },
  { id: "tr1", label: "TR" },
  { id: "ru", label: "RU" },
  { id: "kr", label: "KR" },
  { id: "jp1", label: "JP" },
  { id: "ph2", label: "PH" },
  { id: "sg2", label: "SG" },
  { id: "th2", label: "TH" },
  { id: "tw2", label: "TW" },
  { id: "vn2", label: "VN" },
] as const;

export type BuildPickerPlatformId = (typeof BUILD_PICKER_PLATFORMS)[number]["id"];

export type LiveGameSpell = {
  id: number;
  key: string;
  icon: string;
};

export type LiveGameParticipant = {
  /** Data Dragon display name, matches `ChampionProfile.name`. */
  championName: string;
  /** Data Dragon id, e.g. "KSante". */
  championId: string;
  championIcon: string;
  spells: LiveGameSpell[];
  /** True for the player whose Riot ID was searched. */
  isSearchedPlayer: boolean;
  riotId?: string;
};

export type LiveGameTeamSide = "blue" | "red";

export type BuildRecommendation = {
  /** Matches a `PickerBuild.id` (see `builds.ts`). */
  buildId: string;
  /** Id of the leaf node the tree ended on. */
  leafId: string;
  reason: string;
  /** Picker-only boot inserted into the recommended item order. */
  boot: { itemId: number; slot: 2 | 3 | 4 };
  /** Optional higher-risk pivot shown beneath the recommendation. */
  alternative?: { buildId: string; label: string };
  /** Every decision the tree evaluated, in order. */
  trace: TreeTraceStep[];
  /** Champions whose traits selected the build, for the portrait popups. */
  floatTags: BuildFloatTag[];
  /** Enemy champions without a `ChampionProfile` row; they were ignored. */
  missingProfiles: string[];
};

export type LiveGameLookup =
  | {
      status: "in_game";
      /** Set while the API returns sample data instead of a real Riot lookup. */
      mock?: boolean;
      riotId: string;
      platform: string;
      queue: string;
      gameStartedAt: number | null;
      /** The searched player's side. */
      playerSide: LiveGameTeamSide;
      blue: LiveGameParticipant[];
      red: LiveGameParticipant[];
      recommendation: BuildRecommendation | null;
    }
  | { status: "not_in_game"; riotId: string }
  | { status: "not_found"; riotId: string }
  | { status: "error"; message: string };

/** Serialized `ChampionProfile` row for the admin-ish table at the bottom of the page. */
export type ChampionProfileRow = {
  name: string;
  championId: string;
  icon: string;
  durability: ChampionDurability;
  shields: ChampionShieldLevel;
  damageType: ChampionDamageType;
  damageThreat: ChampionThreatLevel;
  cc: ChampionCcLevel;
};
