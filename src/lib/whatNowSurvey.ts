import type { WhatNowCandidate } from "./whatNow";

export type WhatNowFilter = {
  minEnergy?: number;
  maxEnergy?: number;
  categories?: string[];
  pick?: "timeline" | "timed" | "list";
  soonDays?: number;
  laterDays?: number;
  count?: number;
  result?: "card";
};

export type SurveyChoice = {
  id: string;
  label: string;
  filter?: WhatNowFilter;
  next?: string;
};

export type SurveyQuestion = {
  id: string;
  prompt: string;
  choices: SurveyChoice[];
};

export type SurveyTree = {
  start: string;
  questions: Record<string, SurveyQuestion>;
};

export function mergeFilters(parts: WhatNowFilter[]): WhatNowFilter {
  return parts.reduce<WhatNowFilter>((acc, part) => {
    const categories = acc.categories && part.categories
      ? acc.categories.filter(id => part.categories!.includes(id))
      : part.categories ?? acc.categories;
    return {
      minEnergy: Math.max(acc.minEnergy ?? 1, part.minEnergy ?? 1),
      maxEnergy: Math.min(acc.maxEnergy ?? 10, part.maxEnergy ?? 10),
      ...(categories ? { categories } : {}),
      ...(part.pick ?? acc.pick ? { pick: part.pick ?? acc.pick } : {}),
      ...(part.result ?? acc.result ? { result: part.result ?? acc.result } : {}),
      ...(part.soonDays ?? acc.soonDays ? { soonDays: part.soonDays ?? acc.soonDays } : {}),
      ...(part.laterDays ?? acc.laterDays ? { laterDays: part.laterDays ?? acc.laterDays } : {}),
      ...(part.count ?? acc.count ? { count: part.count ?? acc.count } : {}),
    };
  }, {});
}

export function applyFilter(items: WhatNowCandidate[], filter: WhatNowFilter) {
  const min = filter.minEnergy ?? 1;
  const max = filter.maxEnergy ?? 10;
  return items.filter(item => {
    if (item.hidden && !filter.categories?.includes(item.category)) return false;
    if (item.energy < min || item.energy > max) return false;
    if (filter.categories?.length && !filter.categories.includes(item.category)) return false;
    return true;
  });
}

export function pickSuggestion(items: WhatNowCandidate[], seen: string[]) {
  const remaining = items.filter(item => !seen.includes(`${item.source}:${item.id}`));
  const pool = remaining.length ? remaining : items;
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function daysUntil(planned: string, today = dateKey()) {
  const start = Date.parse(`${today}T12:00:00`);
  const due = Date.parse(`${planned}T12:00:00`);
  if (Number.isNaN(start) || Number.isNaN(due)) return Number.POSITIVE_INFINITY;
  return Math.round((due - start) / 86_400_000);
}

function studioList(items: WhatNowCandidate[], categories?: string[]) {
  return items.filter(item => item.source === "studio" && (!categories?.length || categories.includes(item.category)));
}

function itemKey(item: WhatNowCandidate) {
  return `${item.source}:${item.id}`;
}

function shuffleTake(items: WhatNowCandidate[], count: number) {
  if (!items.length || count < 1) return [];
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const picked: WhatNowCandidate[] = [];
  const used = new Set<string>();
  for (const item of shuffled) {
    const key = itemKey(item);
    if (used.has(key)) continue;
    used.add(key);
    picked.push(item);
    if (picked.length >= count) break;
  }
  return picked;
}

function takeUnused(pool: WhatNowCandidate[], count: number, seen: string[]) {
  return shuffleTake(pool.filter(item => !seen.includes(itemKey(item))), count);
}

function pickFromNeed(pool: WhatNowCandidate[], count: number, seen: string[]) {
  const unused = takeUnused(pool, count, seen);
  return unused.length ? unused : shuffleTake(pool, count);
}

function fillNeed(tiers: WhatNowCandidate[][], count: number, seen: string[]) {
  const picked: WhatNowCandidate[] = [];
  const keys = [...seen];
  for (const tier of tiers) {
    if (picked.length >= count) break;
    const next = takeUnused(tier, count - picked.length, keys);
    picked.push(...next);
    keys.push(...next.map(itemKey));
  }
  return picked.length ? picked : shuffleTake(tiers.flat(), count);
}

export function timedNeedTiers(items: WhatNowCandidate[], filter: WhatNowFilter, today = dateKey()) {
  const list = studioList(items, filter.categories);
  const dated = list.filter(item => item.plannedDate);
  const soonMax = filter.soonDays ?? 3;
  const laterMax = filter.laterDays ?? 7;
  const soon = dated.filter(item => daysUntil(item.plannedDate!, today) <= soonMax);
  const later = dated.filter(item => {
    const days = daysUntil(item.plannedDate!, today);
    return days > soonMax && days <= laterMax;
  });
  const rest = list.filter(item => !soon.includes(item) && !later.includes(item));
  return [soon, later, rest];
}

export function timelineNeedPool(items: WhatNowCandidate[], today = dateKey()) {
  const onTimeline = studioList(items).filter(item => item.plannedDate);
  const soon = onTimeline.filter(item => daysUntil(item.plannedDate!, today) <= 2);
  if (soon.length) return soon;
  return onTimeline.filter(item => {
    const days = daysUntil(item.plannedDate!, today);
    return days >= 3 && days <= 5;
  });
}

export function timedNeedPool(items: WhatNowCandidate[], filter: WhatNowFilter, today = dateKey()) {
  const list = studioList(items, filter.categories);
  const dated = list.filter(item => item.plannedDate);
  const soonMax = filter.soonDays ?? 3;
  const laterMax = filter.laterDays ?? 7;
  const soon = dated.filter(item => daysUntil(item.plannedDate!, today) <= soonMax);
  if (soon.length) return soon;
  const later = dated.filter(item => daysUntil(item.plannedDate!, today) <= laterMax);
  if (later.length) return later;
  return list;
}

export function listNeedPool(items: WhatNowCandidate[], filter: WhatNowFilter) {
  return studioList(items, filter.categories);
}

export function pickManyFromFilter(items: WhatNowCandidate[], filter: WhatNowFilter, seen: string[], today = dateKey()) {
  const count = Math.max(1, filter.count ?? 1);
  if (filter.pick === "timeline") return pickFromNeed(timelineNeedPool(items, today), count, seen);
  if (filter.pick === "timed") return fillNeed(timedNeedTiers(items, filter, today), count, seen);
  if (filter.pick === "list") return pickFromNeed(listNeedPool(items, filter), count, seen);
  return pickFromNeed(applyFilter(items, filter), count, seen);
}

export function pickFromFilter(items: WhatNowCandidate[], filter: WhatNowFilter, seen: string[], today = dateKey()) {
  return pickManyFromFilter(items, filter, seen, today)[0] ?? null;
}

export function filterFromChoice(choice: { minEnergy?: number | null; maxEnergy?: number | null; categories?: string[] }): WhatNowFilter | undefined {
  const filter: WhatNowFilter = {};
  if (choice.minEnergy != null) filter.minEnergy = choice.minEnergy;
  if (choice.maxEnergy != null) filter.maxEnergy = choice.maxEnergy;
  if (choice.categories?.length) filter.categories = choice.categories;
  return filter.minEnergy != null || filter.maxEnergy != null || filter.categories ? filter : undefined;
}
