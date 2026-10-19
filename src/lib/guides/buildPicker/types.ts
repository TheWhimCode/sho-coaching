import type {
  ChampionCcLevel,
  ChampionDamageType,
  ChampionThreatLevel,
} from "@prisma/client";
import type { CompositionFact } from "./compositionFacts";
import type { PickerBuild } from "./builds";
import type { BuildFloatTag, EnemyComposition, TreeTraceStep } from "./decisionTree";

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
  { id: "me1", label: "ME" },
  { id: "sg2", label: "SEA" },
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
  /** Spectator perk ids; the keystone is included when present. */
  perkIds?: number[];
  /** True for the player whose Riot ID was searched. */
  isSearchedPlayer: boolean;
  riotId?: string;
  /** Optional portrait overlays; omitted when the profile has not been rated. */
  durabilityScore?: number | null;
  damageScore?: number | null;
};

export type LiveGameTeamSide = "blue" | "red";

export type BuildRecommendation = {
  /** Catalog from the same deployment as the decision tree, for already-open pages. */
  builds?: PickerBuild[];
  /** Matches a `PickerBuild.id` (see `builds.ts`). */
  buildId: string;
  /** Id of the leaf node the tree ended on. */
  leafId: string;
  reason: string;
  /** Picker-only boot inserted into the recommended item order. */
  boot: { itemId: number; slot: 2 | 3 | 4 };
  /** Optional higher-risk pivot shown beneath the recommendation. */
  alternative?: { buildId: string; label: string };
  /** Nearby durability and (when close) anti-shield routes, shown in the breakdown. */
  alternates: { buildId: string; reason: string }[];
  /** Every decision the tree evaluated, in order. */
  trace: TreeTraceStep[];
  /** Champions whose traits selected the build, for the portrait popups. */
  floatTags: BuildFloatTag[];
  /** Enemy-team counts for the breakdown chart. */
  composition: EnemyComposition;
  /** Item/champion facts that applied to this lobby, shown under the chart. */
  facts: CompositionFact[];
  /** Enemy champions without a `ChampionProfile` row; they were ignored. */
  missingProfiles: string[];
};

export type LiveGameLookup =
  | {
      status: "in_game";
      /** Set while the API returns sample data instead of a real Riot lookup. */
      mock?: boolean;
      /** Live spectator lookup vs a finished match from match history. */
      source?: "live" | "match";
      matchId?: string;
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
  | { status: "live_unavailable"; platform: "vn2" }
  | { status: "unsupported_mode"; message: string }
  | { status: "not_found"; riotId: string }
  | { status: "match_not_found"; matchId: string }
  | { status: "no_viego"; matchId: string }
  | { status: "error"; message: string; code?: "riot_rate_limit" | "rate_limit"; retryAfter?: number };

/** Serialized `ChampionProfile` row for the admin-ish table at the bottom of the page. */
export type ChampionProfileRow = {
  shieldScore: number | null;
  shieldTiming: string | null;
  name: string;
  championId: string;
  icon: string;
  durabilityScore: number | null;
  canBuildSteelcaps: boolean | null;
  mercuryTreadsScore: number | null;
  damageType: ChampionDamageType;
  damageThreat: ChampionThreatLevel;
  damageScore: number | null;
  cc: ChampionCcLevel;
  ccScore: number | null;
};
