import { z } from "zod";

export const socialIdeaSchema = z.object({
  title: z.string().trim().min(1).max(180),
  notes: z.string().trim().max(5000),
  platform: z.enum(["tiktok", "twitter", "reddit"]),
  status: z.enum(["idea", "making", "ready", "posted"]),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const date = new Date(`${value}T12:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }).nullable(),
  reference: z.string().trim().max(2000).refine((value) => {
    if (!value) return true;
    try { return ["http:", "https:"].includes(new URL(value).protocol); }
    catch { return false; }
  }, "Use an http or https link"),
});

export type SocialIdeaInput = z.infer<typeof socialIdeaSchema>;
export type SocialIdea = SocialIdeaInput & { id: string; createdAt: string; updatedAt: string };
