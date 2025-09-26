import "server-only";
import { CFG_SERVER } from "@/lib/config.server";
import { CFG_PUBLIC } from "@/lib/config.public";
import { sign } from "@/lib/sign";

let resendInstance: any;
async function getResend() {
  if (!resendInstance) {
    const { Resend } = await import("resend");
    resendInstance = new Resend(CFG_SERVER.RESEND_API_KEY);
  }
  return resendInstance;
}

/** Accepts "email@example.com" or "Name <email@example.com>", or arrays of those. */
function normalizeRecipient(input?: string | string[]): string | string[] {
  if (!input) throw new Error("Missing recipient email");
  const arr = (Array.isArray(input) ? input : [input])
    .map((s) => (s ?? "").trim())
    .filter(Boolean);
  if (!arr.length) throw new Error("Missing recipient email");

  const cleaned = arr.map((s) => {
    const m = s.match(/^(.+?)<(.+?)>$/);
    const addr = (m ? m[2] : s).trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addr)) {
      throw new Error(`Invalid recipient: ${s}`);
    }
    return m ? `${m[1].trim()} <${addr}>` : addr;
  });
  return cleaned.length === 1 ? cleaned[0] : cleaned;
}

type BookingEmailInput = {
  title: string;
  startISO: string;      // ISO string
  minutes: number;
  followups: number;
  priceEUR: number;      // already /100 outside
  bookingId: string;
  replyTo?: string | string[];
  timeZone?: string;     // e.g. "Europe/Berlin"
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
  } = input;

  const icsUrl = `${CFG_PUBLIC.SITE_URL}/api/ics?bookingId=${encodeURIComponent(
    bookingId
  )}&sig=${encodeURIComponent(sign(bookingId))}`;

  // Optional: expose a Discord invite in your public config
  const discordInvite = (CFG_PUBLIC as any).DISCORD_INVITE_URL as
    | string
    | undefined;

  const whenStr = new Date(startISO).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // ---- HTML (styled like your success page, email-safe) ----
  const html = `<!doctype html>
<html>
  <head>
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta charSet="utf-8" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#0b1222;color:#ffffff;-webkit-font-smoothing:antialiased;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#0b1222;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;">
            <!-- Heading row -->
            <tr>
              <td style="padding:0 0 10px 0; font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu; color:#fff;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="font-size:24px; line-height:32px; font-weight:700;">Payment complete</td>
                    <td align="right">
                      <span style="
                        display:inline-block; padding:6px 10px; border-radius:999px;
                        font-size:12px; line-height:1; color:#7dd3fc;
                        border:1px solid rgba(125,211,252,.35); background:rgba(125,211,252,.10);
                        font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;">
                        ✓ Succeeded
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:0 0 16px 0; font-size:14px; color:#cbd5e1; font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;">
                Thanks! Your payment was successful.
              </td>
            </tr>

            <!-- Card -->
            <tr>
              <td style="
                position:relative;
                border-radius:16px;
                padding:20px;
                background:#0e1526;
                border:1px solid rgba(146,180,255,0.12);
                box-shadow:0 12px 40px rgba(0,0,0,.45);
                font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;
              ">
                <div style="font-size:16px; line-height:24px; font-weight:600; color:#fff; margin-bottom:12px;">
                  ${escapeHtml(title)}
                </div>

                <!-- Two-column details -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td valign="top" width="50%" style="padding:0 12px 12px 0;">
                      ${itemBlock(
                        `When${timeZone ? ` <span style='font-size:10px;text-transform:uppercase;color:#94a3b8'>&nbsp;(${escapeHtml(
                          timeZone
                        )})</span>` : ""}`,
                        `${escapeHtml(whenStr)}`
                      )}
                    </td>
                    <td valign="top" width="50%" style="padding:0 0 12px 12px;">
                      ${itemBlock(
                        "Duration",
                        `${minutes} min${
                          followups > 0
                            ? ` · ${followups} Follow-up${followups === 1 ? "" : "s"}`
                            : ""
                        }`
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td valign="top" width="50%" style="padding:0 12px 0 0;">
                      ${itemBlock(
                        "Price",
                        `€${formatPrice(priceEUR)}`
                      )}
                    </td>
                    <td valign="top" width="50%" style="padding:0 0 0 12px;">
                      <!-- empty to balance layout -->
                    </td>
                  </tr>
                </table>

                <!-- Buttons -->
                <div style="margin-top:14px;">
                  <a href="${icsUrl}"
                     style="display:inline-block;padding:10px 14px;border-radius:12px;
                            text-decoration:none;color:#e5e7eb;font-weight:600;
                            background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15);">
                    Add to calendar
                  </a>
                  ${
                    discordInvite
                      ? `<a href="${escapeHtml(discordInvite)}"
                             style="display:inline-block;padding:10px 14px;border-radius:12px;
                                    text-decoration:none;color:#fff;font-weight:700;margin-left:8px;
                                    background:#5865F2; border:1px solid rgba(255,255,255,0.15);">
                           Join Discord
                         </a>`
                      : ""
                  }
                </div>
              </td>
            </tr>

            <!-- Footer spacing -->
            <tr><td style="height:24px; line-height:24px;">&nbsp;</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  // ---- Plain text fallback ----
  const text =
    `Payment complete\n` +
    `\n${title}\n` +
    `When${timeZone ? ` (${timeZone})` : ""}: ${whenStr}\n` +
    `Duration: ${minutes} min${followups > 0 ? ` · Follow-ups: ${followups}` : ""}\n` +
    `Price: €${formatPrice(priceEUR)}\n` +
    `Add to calendar: ${icsUrl}` +
    (discordInvite ? `\nJoin Discord: ${discordInvite}` : "");

  const resend = await getResend();

  const res = await resend.emails.send({
    from: CFG_SERVER.EMAIL_FROM, // e.g. 'Bookings <bookings@yourdomain.com>'
    to: normalizeRecipient(to),
    ...(replyTo ? { replyTo: normalizeRecipient(replyTo) } : {}),
    subject: `Your booking confirmed — ${title}`,
    html,
    text,
  });

  return res;
}

/* ----------------- helpers ----------------- */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatPrice(n: number): string {
  // keep decimals if present, no rounding
  return new Intl.NumberFormat("de-DE", {
    style: "decimal",
    minimumFractionDigits: n % 1 ? 2 : 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function itemBlock(labelHtml: string, valueText: string): string {
  return `
    <div>
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#94a3b8;margin-bottom:4px;">
        ${labelHtml}
      </div>
      <div style="color:#e5e7eb;line-height:20px;">
        ${escapeHtml(valueText)}
      </div>
    </div>
  `;
}
