import { LINK_TREE_LINKS } from "@/app/_components/linktree/linkTreeLinks";

export const TWITCH_CHANNEL_URL =
  LINK_TREE_LINKS.find((link) => link.id === "twitch")?.href ??
  "https://www.twitch.tv/itsMinooooo";

export const TWITCH_CHANNEL_LOGIN = "itsMinooooo";
export const TWITCH_CHANNEL_DISPLAY = "itsMinooooo";
