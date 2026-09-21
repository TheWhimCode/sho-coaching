import { z } from "zod";

export const socialPlatforms = ["tiktok", "twitter", "reddit"] as const;
export const lifePlatforms = ["selfcare", "food", "home"] as const;
export const vtubePlatforms = ["vtubing"] as const;
export const makePlatforms = ["blender", "unity"] as const;
export const ideaPlatforms = [...socialPlatforms, ...lifePlatforms, ...vtubePlatforms, ...makePlatforms] as const;
export type IdeaPlatform = (typeof ideaPlatforms)[number];
export function isSocialPlatform(platform: string) {
  return (socialPlatforms as readonly string[]).includes(platform);
}
export function isLifePlatform(platform: string) {
  return (lifePlatforms as readonly string[]).includes(platform);
}
export function isVtubePlatform(platform: string) {
  return (vtubePlatforms as readonly string[]).includes(platform);
}
export function isMakePlatform(platform: string) {
  return (makePlatforms as readonly string[]).includes(platform);
}
export const checklistItemSchema = z.object({
  id: z.string().min(1).max(100),
  text: z.string().trim().min(1).max(500),
  done: z.boolean(),
});
export const ideaStatuses = ["idea", "completed"] as const;
export const socialIdeaSchema = z.object({
  title: z.string().trim().min(1).max(180),
  notes: z.string().trim().max(5000),
  platform: z.enum(ideaPlatforms),
  status: z.enum(ideaStatuses).optional(),
  checklist: z.array(checklistItemSchema).max(100).refine(items => new Set(items.map(item => item.id)).size === items.length, "Task IDs must be unique"),
  plannedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
    const date = new Date(`${value}T12:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }).nullable(),
  energy: z.number().int().min(1).max(10).nullable().optional(),
});
export const reorderIdeasSchema = z.object({
  ids: z.array(z.string().trim().min(1).max(100)).min(1).max(200),
});
export type SocialIdeaInput = z.infer<typeof socialIdeaSchema>;
export type SocialIdea = Omit<SocialIdeaInput, "status" | "energy"> & { id: string; status: "idea" | "completed"; energy: number | null; sortOrder: number; placedAt: string | null; createdAt: string; updatedAt: string };
export function isDayKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
export function isCompleted(idea: { status: string }) {
  return idea.status === "completed";
}
