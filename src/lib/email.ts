// src/lib/email.ts
import "server-only";
import { CFG_SERVER } from "@/lib/config.server";
import { CFG_PUBLIC } from "@/lib/config.public";

let resendInstance: any;

async function getResend() {
  if (!resendInstance) {
    if (!CFG_SERVER.RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY");
    }
    const { Resend } = await import("resend");
    resendInstance = new Resend(CFG_SERVER.RESEND_API_KEY);
  }
  return resendInstance;
}

/** Accepts "email@example.com" OR "Name <email@example.com>".
 *  Also accepts arrays and filters empties. Throws on invalids. */
function normalizeRecipient(input?: string | string[]): string | string[] {
  if (!input) throw new Error("Missing recipient email");

  const arr = (Array.isArray(input) ? input : [input])
    .map((s) => (s ?? "").trim())
    .filter(Boolean);

  if (arr.length === 0) throw new Error("Missing recipient email");

  const cleaned = arr.map((s) => {
    // Allow "Name <email>" or plain "email"
    const nameAddr = s.match(/^(.+?)<(.+?)>$/);
    const addr = (nameAddr ? nameAddr[2] : s).trim();

    // very light check; Resend will do full validation
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addr)) {
      throw new Error(`Invalid recipient: ${s}`);
    }
    return nameAddr ? `${nameAddr[1].trim()} <${addr}>` : addr;
  });

  return cleaned.length === 1 ? cleaned[0] : cleaned;
}

type BookingEmailInput = {
  title: string;
  startISO: string;
  minutes: number;
  followups: number;
  priceEUR: number;
  bookingId: string;
  replyTo?: string | string[];
  timeZone?: string; // defaults to server tz if omitted
  icsUrl?: string;   // optional pre-signed ICS URL (preferred if provided)
};

export async function sendBookingEmail(
  to: string | string[],
  input: BookingEmailInput
) {
  const {
    title,
    startISO,
    minutes,
    followups,
    priceEUR,
    bookingId,
    replyTo,
    timeZone,
    icsUrl: signedIcsUrl,
  } = input;

  // Prefer signed URL passed by the webhook; fall back to unsigned (still works if ICS signing disabled)
  const icsUrl =
    signedIcsUrl ||
    `${CFG_PUBLIC.SITE_URL}/api/ics?bookingId=${encodeURIComponent(bookingId)}`;

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
    <p><b>When:</b> ${whenStr}${
      timeZone ? ` <span style="color:#667085">• ${timeZone}</span>` : ""
    }</p>
    <p><b>Duration:</b> ${minutes} min${
      followups > 0 ? ` · <b>Follow-ups:</b> ${followups}` : ""
    }</p>
    <p><b>Price:</b> €${priceEUR}</p>
    <p style="margin-top:16px">
      <a href="${icsUrl}">Add to calendar</a>
    </p>
  `;

  const text =
    `${title}\n` +
    `When: ${whenStr}${timeZone ? ` • ${timeZone}` : ""}\n` +
    `Duration: ${minutes} min${followups > 0 ? ` · Follow-ups: ${followups}` : ""}\n` +
    `Price: €${priceEUR}\n` +
    `Add to calendar: ${icsUrl}`;

  const resend = await getResend();

  try {
    const res = await resend.emails.send({
      from: CFG_SERVER.EMAIL_FROM, // e.g. "Bookings <bookings@yourdomain.com>" (verified domain)
      to: normalizeRecipient(to),
      ...(replyTo ? { replyTo: normalizeRecipient(replyTo) } : {}),
      subject: `Your booking confirmed — ${title}`,
      html,
      text,
    });
    return res; // id/status for logging
  } catch (err: any) {
    const msg = err?.message || String(err);
    throw new Error(`Email send failed: ${msg}`);
  }
}
