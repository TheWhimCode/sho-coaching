/* ------------------------------ Patch ------------------------------ */

export type DDragonRealm = {
  n?: {
    item?: string;
    rune?: string;
    mastery?: string;
    summoner?: string;
    champion?: string;
    profileicon?: string;
    map?: string;
    language?: string;
    sticker?: string;
  };
};

/* ------------------------------ Champions ------------------------------ */

export type ChampionAliasMap = Record<string, string>;

/* ------------------------------ Items ------------------------------ */

export type ItemId = number | string;

/* ------------------------------ Spells ------------------------------ */

export type SummonerSpell = {
  id: string;       // e.g. "SummonerFlash"
  key: string;      // numeric-as-string (e.g. "4")
  name: string;
  description: string;
  cooldown: number[];
  modes: string[];
};

/* ------------------------------ Runes ------------------------------ */

export type Rune = {
  id: number;
  key: string;
  icon: string;
};

export type RuneSlot = {
  runes: Rune[];
};

export type RunesTree = {
  id: number;
  key: string;
  icon: string;
  slots: RuneSlot[];
};

export type PerkSelection = { perk: number };

export type PerkStyle = {
  description?: string;
  style?: number;
  selections?: PerkSelection[];
};

export type RunePerks = {
  statPerks?: {
    offense?: number;
    flex?: number;
    defense?: number;
  };
  styles?: PerkStyle[];
};

export type RuneIconSet = {
  primaryStyleId: number | null;
  secondaryStyleId: number | null;
  keystone: string | null;
  primary: string[];
  secondary: string[];
  shards: string[];
};

/* ------------------------------ Ranks ------------------------------ */

export type RankTier =
  | "IRON" | "BRONZE" | "SILVER" | "GOLD"
  | "PLATINUM" | "EMERALD" | "DIAMOND"
  | "MASTER" | "GRANDMASTER" | "CHALLENGER"
  | "UNRANKED";

export type RankGame = "lol" | "tft";
export type RankFormat = "svg" | "png";

/* ------------------------------ Objectives ------------------------------ */

export type ObjectiveIconMap = Record<string, string>;

/* ------------------------------ Roles ------------------------------ */

export type Role = "top" | "jng" | "mid" | "adc" | "sup";
export type RoleIconMap = Record<Role, string>;
