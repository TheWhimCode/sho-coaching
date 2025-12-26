import type { RoleIconMap } from "./types";

const ROLE_BASE =
  "https://raw.communitydragon.org/15.14/plugins/rcp-fe-lol-parties/global/default/";

export const ROLE_ICONS: RoleIconMap = {
  top: `${ROLE_BASE}/icon-position-top.png`,
  jng: `${ROLE_BASE}/icon-position-jungle.png`,
  mid: `${ROLE_BASE}/icon-position-middle.png`,
  adc: `${ROLE_BASE}/icon-position-bottom.png`,
  sup: `${ROLE_BASE}/icon-position-utility.png`,
};
