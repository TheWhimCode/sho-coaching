export type Cfg = { liveMin: number; liveBlocks: number; followups: number };
export const MIN=30, MAX=120;
export function clamp(c: Cfg): Cfg { const need=c.liveBlocks*45; return {
  liveMin: Math.min(MAX, Math.max(MIN, Math.max(c.liveMin, need))),
  liveBlocks: c.liveBlocks, followups: c.followups
};}
export const addLiveBlock  = (c: Cfg) => c.liveMin+45>MAX ? c : clamp({...c, liveBlocks:c.liveBlocks+1, liveMin:c.liveMin+45});
export const removeLiveBlock = (c: Cfg) => c.liveBlocks? clamp({...c, liveBlocks:c.liveBlocks-1, liveMin:Math.max(MIN, c.liveMin-45)}) : c;
