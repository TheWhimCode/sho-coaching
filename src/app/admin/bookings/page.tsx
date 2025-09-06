// src/app/admin/bookings/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { colorsByPreset } from "@/lib/sessions/colors";

type BookingRow = {
  id: string;
  liveMinutes: number;
  discord: string;
  sessionType: string;
  followups: number;
  liveBlocks: number | null; // may come back null/undefined from API
  notes: string | null;
  scheduledStart: string; // ISO
};

type DayGroup = { key: string; label: string; items: BookingRow[] };

// Columns: dot | time | length | live blocks | follow-ups | discord | notes
const GRID =
  "grid grid-cols-[20px_110px_96px_120px_130px_minmax(0,1fr)_minmax(0,1.2fr)] gap-x-4 items-center";

// -------- time & grouping helpers --------
function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function toLocalDayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
function prettyDayLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
function splitUpcomingPast(rows: BookingRow[]) {
  const now = Date.now();
  const upcoming: BookingRow[] = [];
  const past: BookingRow[] = [];
  for (const r of rows) (new Date(r.scheduledStart).getTime() >= now ? upcoming : past).push(r);
  upcoming.sort((a, b) => +new Date(a.scheduledStart) - +new Date(b.scheduledStart));
  past.sort((a, b) => +new Date(b.scheduledStart) - +new Date(a.scheduledStart));
  return { upcoming, past };
}
function groupByDay(sorted: BookingRow[]) {
  const map = new Map<string, DayGroup>();
  for (const r of sorted) {
    const k = toLocalDayKey(r.scheduledStart);
    if (!map.has(k)) map.set(k, { key: k, label: prettyDayLabel(r.scheduledStart), items: [] });
    map.get(k)!.items.push(r);
  }
  return [...map.values()];
}

// -------- color + dot helpers --------
function hexToRgba(hex: string, alpha = 1) {
  const s = hex.replace("#", "");
  let r = 0,
    g = 0,
    b = 0,
    a = 255;
  if (s.length === 6) [r, g, b] = [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
  if (s.length === 8) [r, g, b, a] = [0, 2, 4, 6].map((i) => parseInt(s.slice(i, i + 2), 16));
  const outA = Math.max(0, Math.min(1, (a / 255) * alpha));
  return `rgba(${r}, ${g}, ${b}, ${outA})`;
}
function presetFromSessionType(t: string): keyof typeof colorsByPreset | "custom" {
  const x = t.toLowerCase();
  if (x.includes("instant")) return "instant";
  if (x.includes("signature")) return "signature";
  if (x.includes("vod")) return "vod";
  if (x.includes("custom")) return "custom";
  return "custom";
}
function GlowingDot({ sessionType }: { sessionType: string }) {
  const key = presetFromSessionType(sessionType);
  const preset = colorsByPreset[key] ?? { ring: "#a3a3a3", glow: "rgba(163,163,163,.45)" };
  const ringSoft = hexToRgba(preset.ring, 0.35);
  return (
    <span
      aria-label={sessionType}
      title={sessionType}
      className="inline-block rounded-full"
      style={{
        width: 12,
        height: 12,
        background: preset.ring,
        boxShadow: `0 0 0 2px ${ringSoft}, 0 0 12px 4px ${preset.glow}`,
      }}
    />
  );
}

const Chip = ({ className = "", children }: { className?: string; children: React.ReactNode }) => (
  <span className={`px-2 py-0.5 rounded-lg text-[11px] ring-1 whitespace-nowrap ${className}`}>{children}</span>
);

export default function AdminBookingsPage() {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [log, setLog] = useState("");
  const [showPast, setShowPast] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/bookings?range=all`, { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as BookingRow[];
        if (on) setRows(data);
      } catch (e: any) {
        if (on) setLog(`❌ Failed to load: ${e?.message ?? e}`);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => {
      on = false;
    };
  }, []);

  const prettyTZ = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const { upcoming, past } = useMemo(() => splitUpcomingPast(rows), [rows]);
  const upcomingGroups = useMemo(() => groupByDay(upcoming), [upcoming]);
  const pastGroups = useMemo(() => groupByDay(past), [past]);

  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopiedId(id);
      setTimeout(() => setCopiedId((v) => (v === id ? null : v)), 1000);
    } catch {
      setLog("❌ Clipboard copy failed.");
    }
  }

  const Row = ({ r }: { r: BookingRow }) => {
    const blocks = r.liveBlocks ?? 0;
    return (
      <li className="px-5 py-3">
        <div className={GRID}>
          {/* dot */}
          <GlowingDot sessionType={r.sessionType} />

          {/* time */}
          <div className="text-white/90 tabular-nums">{formatTime(r.scheduledStart)}</div>

          {/* length chip */}
          <div>
            <Chip className="bg-sky-500/15 text-sky-200 ring-sky-400/25">{r.liveMinutes} min</Chip>
          </div>

          {/* live blocks chip (0–2) */}
          <div>
            <Chip className="bg-violet-500/15 text-violet-200 ring-violet-400/25">Live Blocks: {blocks}</Chip>
          </div>

          {/* follow-ups chip */}
          <div>
            <Chip className="bg-emerald-500/15 text-emerald-200 ring-emerald-400/25">
              Follow-ups: {r.followups}
            </Chip>
          </div>

          {/* discord (click-to-copy) */}
          <div className="truncate">
            {r.discord ? (
              <button
                onClick={() => copy(r.discord, r.id)}
                title="Click to copy Discord"
                className={`text-left truncate hover:underline decoration-white/40 ${
                  copiedId === r.id ? "text-emerald-300" : "text-white/90"
                }`}
              >
                {r.discord}
              </button>
            ) : (
              <span className="text-white/40">—</span>
            )}
          </div>

          {/* notes */}
          <div className="text-white/70 text-sm break-words">{r.notes ? r.notes : <span className="text-white/35">—</span>}</div>
        </div>
      </li>
    );
  };

  const Group = ({ g }: { g: DayGroup }) => (
    <section className="overflow-hidden rounded-2xl ring-1 ring-white/10 bg-neutral-900/60">
      <div className="sticky top-0 z-10 bg-neutral-900/80 backdrop-blur px-5 py-2">
        <span className="inline-block text-xs tracking-wide uppercase text-white/80 bg-white/10 ring-1 ring-white/15 px-2 py-1 rounded-lg">
          {g.label}
        </span>
      </div>
      <ul className="divide-y divide-white/10">
        {g.items.map((r) => (
          <Row key={r.id} r={r} />
        ))}
      </ul>
    </section>
  );

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-purple-900 via-black to-indigo-950 text-white">
      <div className="w-full max-w-6xl p-8 space-y-8 bg-black/40 rounded-3xl border border-purple-500/30 shadow-[0_0_30px_rgba(150,0,255,0.3)]">
        <motion.h1
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-4xl md:text-5xl font-extrabold text-center bg-gradient-to-r from-fuchsia-400 to-cyan-400 bg-clip-text text-transparent"
        >
          ✨ Bookings
        </motion.h1>

        <p className="text-center text-purple-300">
          Times shown in your timezone: <span className="text-purple-100 font-medium">{prettyTZ}</span>
        </p>

        {/* Upcoming */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Upcoming</h2>
            <div className="text-sm text-white/60">
              {loading ? "Loading…" : `${upcoming.length} booking${upcoming.length === 1 ? "" : "s"}`}
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-white/70 bg-neutral-900/60 rounded-2xl ring-1 ring-white/10">Summoning bookings…</div>
          ) : upcoming.length === 0 ? (
            <div className="p-6 text-white/70 bg-neutral-900/60 rounded-2xl ring-1 ring-white/10">Nothing upcoming.</div>
          ) : (
            <div className="space-y-4">
              {upcomingGroups.map((g) => (
                <Group key={g.key} g={g} />
              ))}
            </div>
          )}
        </section>

        {/* Past */}
        <section className="space-y-4">
          <button
            onClick={() => setShowPast((v) => !v)}
            className="w-full flex items-center justify-between rounded-xl px-4 py-3 bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition"
          >
            <span className="text-lg font-semibold">Past</span>
            <span className="text-sm text-white/70">
              {loading ? "…" : `${past.length} booking${past.length === 1 ? "" : "s"}`} {showPast ? "▲" : "▼"}
            </span>
          </button>

          <AnimatePresence initial={false}>
            {showPast && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                {loading ? (
                  <div className="p-6 text-white/70 bg-neutral-900/60 rounded-2xl ring-1 ring-white/10">Consulting the archives…</div>
                ) : past.length === 0 ? (
                  <div className="p-6 text-white/70 bg-neutral-900/60 rounded-2xl ring-1 ring-white/10">No past bookings yet.</div>
                ) : (
                  <div className="space-y-4">
                    {pastGroups.map((g) => (
                      <Group key={g.key} g={g} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {log && <pre className="bg-neutral-900/80 rounded-lg p-3 text-sm text-purple-300">{log}</pre>}
      </div>
    </div>
  );
}
