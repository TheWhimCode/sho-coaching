import type { RankTier, RankGame, RankFormat } from "./types";

export function rankEmblemUrl(tier: RankTier) {
  const base =
    "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem";

  return tier === "UNRANKED"
    ? `${base}/emblem-unranked.png`
    : `${base}/emblem-${tier.toLowerCase()}.png`;
}

export function rankMiniCrestUrl(
  tier: RankTier,
  game: RankGame = "lol",
  format: RankFormat = "svg"
) {
  const base =
    "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests";

  const t = tier.toLowerCase();

  if (game === "tft")
    return `${base}/${t === "unranked" ? "unranked-tft.svg" : `${t}_tft.svg`}`;

  return format === "svg"
    ? `${base}/${t}.svg`
    : `${base}/${t}.png`;
}

export function rankMiniCrestSvg(tier: RankTier) {
  return rankMiniCrestUrl(tier, "lol", "svg");
}
