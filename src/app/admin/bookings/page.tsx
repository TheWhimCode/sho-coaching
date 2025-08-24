// src/app/admin/bookings/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type BookingRow = {
  id: string;
  liveMinutes: number;
  discord: string;
  sessionType: string;
  followups: number;
  notes: string | null;
  scheduledStart: string; // ISO
};

function Badge({
  children,
  tone = "emerald",
}: {
  children: React.ReactNode; // allow numbers/strings/elements
  tone?: "emerald" | "violet" | "rose" | "sky";
}) {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/25",
    violet: "bg-violet-500/15 text-violet-200 ring-violet-400/25",
    rose: "bg-rose-500/15 text-rose-200 ring-rose-400/25",
    sky: "bg-sky-500/15 text-sky-200 ring-sky-400/25",
  };
  return (
    <span className={`px-2 py-0.5 rounded-lg text-[11px] ring-1 ${tones[tone]} whitespace-nowrap`}>
      {children}
    </span>
  );
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  // e.g., "Thu, Sep 5 · 19:30"
  const date = d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}

function splitUpcomingPast(rows: BookingRow[]) {
  const now = Date.now();
  const upcoming: BookingRow[] = [];
  const past: BookingRow[] = [];
  for (const r of rows) {
    (new Date(r.scheduledStart).getTime() >= now ? upcoming : past).push(r);
  }
  // upcoming soonest-first, past newest-first
  upcoming.sort((a, b) => +new Date(a.scheduledStart) - +new Date(b.scheduledStart));
  past.sort((a, b) => +new Date(b.scheduledStart) - +new Date(a.scheduledStart));
  return { upcoming, past };
}

export default function AdminBookingsPage() {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [log, setLog] = useState("");
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    let on = true;
    (async () => {
      setLoading(true);
      try {
        // Ask for all paid bookings, then split client-side
        const res = await fetch(`/api/admin/bookings?range=all`, { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as BookingRow[];
        if (on) setRows(data);
      } catch (e: any) {
        if (on) setLog(`❌ Failed to load: ${e?.message || e}`);
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

  const TableHead = () => (
    <div className="grid grid-cols-[1.3fr_.9fr_1.2fr_.8fr_.8fr_2fr] gap-px bg-white/5 text-xs uppercase tracking-wider text-white/60">
      <div className="px-3 py-2 bg-neutral-900/70">When</div>
      <div className="px-3 py-2 bg-neutral-900/70">Length</div>
      <div className="px-3 py-2 bg-neutral-900/70">Type</div>
      <div className="px-3 py-2 bg-neutral-900/70">In-Game</div>
      <div className="px-3 py-2 bg-neutral-900/70">Followups</div>
      <div className="px-3 py-2 bg-neutral-900/70">Discord / Notes</div>
    </div>
  );

  const Row = ({ r }: { r: BookingRow }) => (
    <li className="grid grid-cols-[1.3fr_.9fr_1.2fr_.8fr_.8fr_2fr]">
      <div className="px-3 py-3 flex items-center">
        <span className="text-white/90">{formatWhen(r.scheduledStart)}</span>
      </div>
      <div className="px-3 py-3 flex items-center">
        <Badge tone="sky">{r.liveMinutes} min</Badge>
      </div>
      <div className="px-3 py-3 flex items-center">
        <span className="text-white/90">{r.sessionType}</span>
      </div>
      <div className="px-3 py-3 flex items-center">
        <span className="text-white/90">{r.followups}</span>
      </div>
      <div className="px-3 py-3 space-y-1">
        <div className="text-white/85 truncate">{r.discord || <span className="text-white/40">—</span>}</div>
        <p className="text-white/70 text-sm line-clamp-2 break-words">
          {r.notes || <span className="text-white/40">—</span>}
        </p>
      </div>
    </li>
  );

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-purple-900 via-black to-indigo-950 text-white">
      <div className="w-full max-w-5xl p-8 space-y-8 bg-black/40 rounded-3xl border border-purple-500/30 shadow-[0_0_30px_rgba(150,0,255,0.3)]">
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

        {/* UPCOMING */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Upcoming</h2>
            <div className="text-sm text-white/60">
              {loading ? "Loading…" : `${upcoming.length} booking${upcoming.length === 1 ? "" : "s"}`}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl ring-1 ring-white/10 bg-neutral-900/60">
            <TableHead />
            {loading ? (
              <div className="p-6 text-white/70">Summoning bookings…</div>
            ) : upcoming.length === 0 ? (
              <div className="p-6 text-white/70">Nothing upcoming.</div>
            ) : (
              <ul className="divide-y divide-white/10">
                {upcoming.map((r) => (
                  <Row key={r.id} r={r} />
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* PAST (collapsible) */}
        <section className="space-y-3">
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
                <div className="overflow-hidden rounded-2xl ring-1 ring-white/10 bg-neutral-900/60">
                  <TableHead />
                  {loading ? (
                    <div className="p-6 text-white/70">Consulting the archives…</div>
                  ) : past.length === 0 ? (
                    <div className="p-6 text-white/70">No past bookings yet.</div>
                  ) : (
                    <ul className="divide-y divide-white/10">
                      {past.map((r) => (
                        <Row key={r.id} r={r} />
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {log && <pre className="bg-neutral-900/80 rounded-lg p-3 text-sm text-purple-300">{log}</pre>}
      </div>
    </div>
  );
}
