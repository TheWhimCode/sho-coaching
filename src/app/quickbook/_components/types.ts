// src/app/quickbook/_components/types.ts

import type { ProductId } from "@/engine/session";

export type DiscordIdentity = {
  id: string;
  username?: string | null;
};

export type QuickbookConfig = {
  sessionType: string;
  liveMinutes: number;
  followups: number;
  liveBlocks: number;
  productId?: ProductId;
};

export type RiotVerified = {
  riotTag: string;
  puuid: string;
  region: string;
};