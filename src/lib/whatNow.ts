export const categoryDefaultEnergy: Record<string, number> = {
  selfcare: 5,
  food: 6,
  home: 5,
  twitter: 5,
  reddit: 5,
  tiktok: 8,
  vtubing: 6,
  blender: 7,
  unity: 9,
};

export function effectiveEnergy(override: number | null | undefined, categoryDefault: number | undefined) {
  return override ?? categoryDefault ?? 5;
}

export type WhatNowSource = "studio" | "catalog";
export type WhatNowCandidate = {
  source: WhatNowSource;
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  energy: number;
  energyOverride: number | null;
  hidden?: boolean;
  steps: string[];
  plannedDate?: string | null;
};

export function activitySteps(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const steps: string[] = [];
  for (const item of value) {
    if (typeof item === "string") {
      const text = item.trim();
      if (text) steps.push(text);
      continue;
    }
    if (item && typeof item === "object" && "text" in item && typeof (item as { text: unknown }).text === "string") {
      const row = item as { text: string; done?: unknown };
      if (row.done === true) continue;
      const text = row.text.trim();
      if (text) steps.push(text);
    }
  }
  return steps;
}

export function stepsForGuide(item: WhatNowCandidate) {
  return item.steps.length ? item.steps : [item.title];
}
