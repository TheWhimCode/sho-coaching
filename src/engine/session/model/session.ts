// engine/session/model/session.ts

/**
 * Core domain model for a session configuration.
 * This defines what a session *is*, structurally.
 */
export type SessionConfig = {
  liveMin: number;
  liveBlocks: number;
  followups: number;
};

/**
 * Domain invariants that always hold true for a valid session.
 */
export const MIN_MINUTES = 30;
export const MAX_MINUTES = 120;
export const LIVEBLOCK_MIN = 45;
export const MAX_BLOCKS = 2;
