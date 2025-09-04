import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { verify } from "@/lib/sign";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fmtUTC(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}
function esc(s = "") {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
function fold(line: string) {
  const out: string[] = [];
  for (let i = 0; i < line.length; i += 70) out.push(i ? " " + line.slice(i, i + 70) : line.slice(i, i + 70));
  return out.join("\r\n");
}
function noStore(body: any, status = 200, headers: Record<string,string> = {}) {
  return new NextResponse(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`ics:${ip}`, 30, 60_000)) return noStore("not found", 404, { "Content-Type": "text/plain" });

  const u = new URL(req.url);
  const id = u.searchParams.get("bookingId")?.trim() || "";
  const sig = u.searchParams.get("sig")?.trim() || "";

  // signed link + basic id sanity
  if (!UUID_RX.test(id) || !sig || !verify(id, sig)) {
    return noStore("not found", 404, { "Content-Type": "text/plain" });
  }

  const b = await prisma.booking.findUnique({ where: { id } });
  if (!b?.scheduledStart || !b?.scheduledMinutes) {
    return noStore("not found", 404, { "Content-Type": "text/plain" });
  }

  const start = b.scheduledStart;
  const end = new Date(start.getTime() + b.scheduledMinutes * 60_000);
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "") || "https://sho.example";
  const summary = b.sessionType || "Coaching Session";
  const description = `Booking #${b.id} • Follow-ups: ${b.followups ?? 0}`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//sho-coaching//calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${b.id}@sho-coaching`,
    `DTSTAMP:${fmtUTC(new Date())}`,
    `DTSTART:${fmtUTC(start)}`,
    `DTEND:${fmtUTC(end)}`,
    fold(`SUMMARY:${esc(summary)}`),
    fold(`DESCRIPTION:${esc(description)}`),
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    fold(`URL:${esc(`${site}/sessions/vod-review`)}`),
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
