import { prisma } from "@/lib/prisma";

/** 10.00 EUR */
export const SPEED_REVIEW_PRIORITY_AMOUNT_CENTS = 1000;

export async function applySpeedReviewPriorityPayment(
  queueEntryId: string,
  paymentRef: string,
  amountReceivedCents: number
): Promise<void> {
  if (amountReceivedCents < SPEED_REVIEW_PRIORITY_AMOUNT_CENTS) {
    console.warn("[speed-review] priority payment amount too low", {
      queueEntryId,
      paymentRef,
      amountReceivedCents,
    });
    throw new Error("speed_review_priority_amount_invalid");
  }

  const row = await prisma.speedReviewQueue.findUnique({
    where: { id: queueEntryId },
    select: { id: true, reviewStatus: true },
  });
  if (!row) {
    throw new Error("speed_review_queue_not_found");
  }
  if (row.reviewStatus !== "Pending") {
    throw new Error("speed_review_queue_not_pending");
  }

  await prisma.speedReviewQueue.update({
    where: { id: queueEntryId },
    data: { paidPriority: true },
  });
}
