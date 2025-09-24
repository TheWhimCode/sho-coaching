// lib/lolRanges.ts
export type RangeKey = 'S2025' | 'S2025-Split1' | 'S2025-Split2';
export const RANGES: Record<RangeKey, { label: string; start: number; end?: number }> = {
  'S2025':        { label: 'Season 2025',       start: Date.UTC(2025,0,8)/1000 },   // fill exact dates
  'S2025-Split1': { label: 'S2025 • Split 1',   start: Date.UTC(2025,0,8)/1000, end: Date.UTC(2025,4,15)/1000 },
  'S2025-Split2': { label: 'S2025 • Split 2',   start: Date.UTC(2025,4,15)/1000 }, // open-ended = now
};
