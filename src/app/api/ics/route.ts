import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function fmtUTC(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}
function esc(s = "") {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const id = u.searchParams.get("bookingId");
  if (!id) return new Response("bookingId required", { status: 400 });

  const b = await prisma.booking.findUnique({
    where: { id },
  });
  if (!b) return new Response("not found", { status: 404 });

  // Use schedule snapshot
  const start = b.scheduledStart;
  const end = new Date(start.getTime() + b.scheduledMinutes * 60_000);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//your-site//coaching//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${b.id}@your-site`,
    `DTSTAMP:${fmtUTC(new Date())}`,
    `DTSTART:${fmtUTC(start)}`,
    `DTEND:${fmtUTC(end)}`,
    `SUMMARY:${esc(b.sessionType || "Coaching Session")}`,
    `DESCRIPTION:${esc(
      `Discord: ${b.discord || "—"} | Follow-ups: ${b.followups}`
    )}`,
    `STATUS:CONFIRMED`,
    `TRANSP:OPAQUE`,
    `URL:${esc(
      process.env.NEXT_PUBLIC_SITE_URL || ""
    )}/sessions/vod-review`,
    // Optional reminders:
    "BEGIN:VALARM",
    "TRIGGER:-PT24H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Session in 24 hours",
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Session in 2 hours",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const ics = lines.join("\r\n") + "\r\n";

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="booking-${b.id}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
