import type { ProductId } from "./product";

export type SessionConfig = {
  liveMin: number;
  liveBlocks: number;
  followups: number;
  productId?: ProductId; // optional bundle/product ref
};

export const MIN_MINUTES = 30;
export const MAX_MINUTES = 120;
export const LIVEBLOCK_MIN = 45;
export const MAX_BLOCKS = 2;
