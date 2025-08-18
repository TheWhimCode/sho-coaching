// src/lib/email.ts
import "server-only";

let resendInstance: any;

async function getResend() {
  if (!resendInstance) {
    const { Resend } = await import("resend");
    resendInstance = new Resend(process.env.RESEND_API_KEY!);
  }
  return resendInstance;
}

export async function sendBookingEmail(
  to: string,
  { title, startISO, minutes, followups, priceEUR, bookingId }:
  { title:string; startISO:string; minutes:number; followups:number; priceEUR:number; bookingId:string; }
) {
  const icsUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/ics?title=${encodeURIComponent(title)}&start=${encodeURIComponent(startISO)}&minutes=${minutes}&description=${encodeURIComponent(`Follow-ups: ${followups} · €${priceEUR}`)}`;

  const html = `
    <h2>${title}</h2>
    <p><b>When:</b> ${new Date(startISO).toLocaleString()}</p>
    <p><b>Duration:</b> ${minutes} min · <b>Follow-ups:</b> ${followups}</p>
    <p><b>Price:</b> €${priceEUR}</p>
    <p><a href="${icsUrl}">Add to calendar (.ics)</a></p>
  `;

  const resend = await getResend();
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: `Your booking confirmed — ${title}`,
    html,
  });
}
