import type { ObjectiveIconMap } from "./types";

const OBJECTIVE_BASE =
  "https://raw.communitydragon.org/latest/game/assets/ux/announcements";

const STATSTONE_BASE =
  "https://raw.communitydragon.org/latest/game/assets/ux/statstones/icons";

export const OBJECTIVE_ICONS: ObjectiveIconMap = {
  atakhan: `${OBJECTIVE_BASE}/atakhan_dark_circle_128px.png`,
  voidgrubs: `${OBJECTIVE_BASE}/sru_voidgrub_circle.png`,
  baron: `${OBJECTIVE_BASE}/baron_circle.png`,
  herald: `${OBJECTIVE_BASE}/sruriftherald_circle.png`,
  dragon: `${OBJECTIVE_BASE}/dragon_circle.png`,
  elder: `${OBJECTIVE_BASE}/drake_elder_circle.png`,
  inhibitor: `${OBJECTIVE_BASE}/inhibitor_circle.png`,
  turret: `${OBJECTIVE_BASE}/tower_circle.png`,
  baronGlyph: `${STATSTONE_BASE}/baron.png`,
  heraldGlyph: `${STATSTONE_BASE}/herald.png`,
  dragonGlyph: `${STATSTONE_BASE}/dragon.png`,
  elderGlyph: `${STATSTONE_BASE}/elder.png`,
  inhibitorGlyph: `${STATSTONE_BASE}/inhibitor.png`,
  turretGlyph: `${STATSTONE_BASE}/tower.png`,
  infernal: `${STATSTONE_BASE}/infernodragon.png`,
  mountain: `${STATSTONE_BASE}/mountaindragon.png`,
  cloud: `${STATSTONE_BASE}/clouddragon.png`,
  ocean: `${STATSTONE_BASE}/oceandragon.png`,
  hextech: `${STATSTONE_BASE}/hextechdragon.png`,
  chemtech: `${STATSTONE_BASE}/chemtechdragon.png`,
};
