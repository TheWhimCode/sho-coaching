import type { Prisma } from "@prisma/client";

/** Paid first → fewer past reviews → earlier queueDate */
export const speedReviewQueueOrderBy: Prisma.SpeedReviewQueueOrderByWithRelationInput[] = [
  { paidPriority: "desc" },
  { previousReviews: "asc" },
  { queueDate: "asc" },
];
