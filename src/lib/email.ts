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

export async function sendBookingEmail(
  to: string,
  {
    title,
    startISO,
    minutes,
    followups,
    priceEUR,
    bookingId,
  }: {
    title: string;
    startISO: string;
    minutes: number;
    followups: number;
    priceEUR: number;
    bookingId: string;
  }
) {
  const icsUrl = `${CFG_PUBLIC.SITE_URL}/api/ics?bookingId=${bookingId}`;

  const html = `
    <h2>${title}</h2>
    <p><b>When:</b> ${new Date(startISO).toLocaleString()}</p>
    <p><b>Duration:</b> ${minutes} min · <b>Follow-ups:</b> ${followups}</p>
    <p><b>Price:</b> €${priceEUR}</p>
    <p><a href="${icsUrl}">Add to calendar (.ics)</a></p>
  `;

  const resend = await getResend();
  await resend.emails.send({
    from: CFG_SERVER.EMAIL_FROM,
    to,
    subject: `Your booking confirmed — ${title}`,
    html,
    text: `${title}\nWhen: ${new Date(startISO).toLocaleString()}\nDuration: ${minutes} min · Follow-ups: ${followups}\nPrice: €${priceEUR}\nAdd to calendar: ${icsUrl}`,
  });
}
