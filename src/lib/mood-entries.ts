import { z } from "zod";

export const moodRatingFields = ["mood", "energy", "stress", "motivation", "mentalClarity"] as const;
const rating = z.number().int().min(1).max(5).nullable().optional();
// Require an explicit offset for text input; Date values already represent instants.
const recordedAt = z.union([z.date(), z.iso.datetime({ offset: true }).transform(value => new Date(value))]);

// Validate the full resulting entry on creation or edit, not an isolated partial patch.
// IDs and audit timestamps are managed by Prisma, not accepted from input.
export const moodEntryInputSchema = z.object({
  recordedAt,
  mood: rating,
  energy: rating,
  stress: rating,
  motivation: rating,
  mentalClarity: rating,
  note: z.string().nullable().optional(),
}).strict().refine(entry => moodRatingFields.some(field => entry[field] != null), {
  message: "Include at least one rating from 1 to 5.",
});

export type MoodEntryInput = z.infer<typeof moodEntryInputSchema>;
