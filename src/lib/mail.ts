// src/lib/mail.ts
import { prisma } from "@/lib/prisma";

export async function sendBookingConfirmation(slotId: string) {
  const booking = await prisma.booking.findUnique({ where: { slotId }, include: { slot: true } });
  if (!booking || !booking.slot) return;

  const to = process.env.BOOKING_CONFIRM_TO ?? ""; // or collect buyer email
  if (!to) return;

  const start = booking.slot.startTime;
  const minutes = booking.liveMinutes;

  // Resend/Postmark/SES here. Minimal placeholder:
  console.log("EMAIL ->", to, {
    subject: `Booking confirmed: ${booking.sessionType}`,
    body: `Your session on ${start.toISOString()} for ${minutes} minutes is confirmed.`,
    icsUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/ics?bookingId=${booking.id}`,
  });
}
