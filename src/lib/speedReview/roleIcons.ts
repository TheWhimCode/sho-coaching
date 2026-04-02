import { ROLE_ICONS } from "@/lib/datadragon/roles";

type DraftRoleKey = keyof typeof ROLE_ICONS;

/** Map speed-review queue role strings → Data Dragon position icons */
const TO_DRAFT: Record<string, DraftRoleKey> = {
  TOP: "top",
  JUNGLE: "jng",
  MID: "mid",
  BOTTOM: "adc",
  SUPPORT: "sup",
  FILL: "mid",
};

export function speedReviewRoleIconUrl(role: string): string {
  const k = TO_DRAFT[role.trim().toUpperCase()] ?? "mid";
  return ROLE_ICONS[k];
}
