// src/lib/email.ts
import "server-only";
import { CFG_SERVER } from "@/lib/config.server";
import { CFG_PUBLIC } from "@/lib/config.public";

let resendInstance: any;
async function getResend() {
  if (!resendInstance) {
    const { Resend } = await import("resend");
    resendInstance = new Resend(CFG_SERVER.RESEND_API_KEY);
  }
  return resendInstance;
}

type BookingEmailInput = {
  title: string;
  startISO: string;
  minutes: number;
  followups: number;
  priceEUR: number;
  bookingId: string;
  replyTo?: string;
  timeZone?: string; // defaults to server tz
};

export async function sendBookingEmail(to: string, input: BookingEmailInput) {
  const {
    title,
    startISO,
    minutes,
    followups,
    priceEUR,
    bookingId,
    replyTo,
    timeZone,
  } = input;

  const icsUrl = `${CFG_PUBLIC.SITE_URL}/api/ics?bookingId=${encodeURIComponent(
    bookingId
  )}`;

  const whenStr = new Date(startISO).toLocaleString([], {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone, // show user tz if you pass it
  });

  const html = `
    <h2 style="margin:0 0 12px">${title}</h2>
    <p><b>When:</b> ${whenStr}</p>
    <p><b>Duration:</b> ${minutes} min · <b>Follow-ups:</b> ${followups}</p>
    <p><b>Price:</b> €${priceEUR}</p>
    <p style="margin-top:16px">
      <a href="${icsUrl}">Add to calendar (.ics)</a>
    </p>
  `;

  const text =
    `${title}\n` +
    `When: ${whenStr}\n` +
    `Duration: ${minutes} min · Follow-ups: ${followups}\n` +
    `Price: €${priceEUR}\n` +
    `Add to calendar: ${icsUrl}`;

  const resend = await getResend();

  try {
    const res = await resend.emails.send({
      from: CFG_SERVER.EMAIL_FROM, // e.g. "Bookings <bookings@yourdomain.com>"
      to,
      replyTo,
      subject: `Your booking confirmed — ${title}`,
      html,
      text,
    });
    return res; // contains id/status for logging
  } catch (err) {
    // Surface a concise error message up the stack
    throw new Error(`Email send failed: ${String((err as any)?.message || err)}`);
  }
}
