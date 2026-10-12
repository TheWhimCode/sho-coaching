import type { LiveGameParticipant } from "./types";

/** A single notice: the champion warning takes priority over the lane warning. */
export function buildPickerPlayerTip(player?: LiveGameParticipant): string | null {
  if (!player) return null;
  if (player.championId !== "Viego") {
    return `You're playing ${player.championName}. This is a Viego build suggestion.`;
  }
  if (!player.spells.some((spell) => spell.id === 11)) {
    return "You're playing Viego without Smite. This recommendation is for jungle Viego, not laning.";
  }
  return null;
}
