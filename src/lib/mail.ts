import { prisma } from "@/lib/prisma";
import { CFG } from "@/lib/config.public";

export async function sendBookingConfirmation(slotId: string) {
  const booking = await prisma.booking.findUnique({
    where: { slotId },
    include: { slot: true },
  });

  if (!booking || !booking.slot) return;

  const to = CFG.server.EMAIL_FROM || CFG.server.ADMIN_USER; // fallback if needed
  if (!to) return;

  const start = booking.slot.startTime;
  const minutes = booking.liveMinutes;

  // Resend/Postmark/SES here. Minimal placeholder:
  console.log("EMAIL ->", to, {
    subject: `Booking confirmed: ${booking.sessionType}`,
    body: `Your session on ${start.toISOString()} for ${minutes} minutes is confirmed.`,
    icsUrl: `${CFG.public.SITE_URL}/api/ics?bookingId=${booking.id}`,
  });
}
