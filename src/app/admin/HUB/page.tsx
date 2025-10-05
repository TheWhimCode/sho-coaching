// src/app/admin/hub/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SessionRowItem, { SessionRow as BookingRow } from "@/app/admin/sessions/SessionRow";
import StudentCard from "@/app/admin/students/StudentCard";

// ---- Types ----
type Student = {
  id: string;
  name: string;
  discordName: string | null;
  riotTag: string | null;
  server: string | null;
  createdAt: string;
  updatedAt: string;
};

type ClimbResp = {
  overall?: { deltaToLatest: number } | null;
  delta7d?: number;
};

// ---- Small UI bits reused across the hub ----
const GRID =
  "grid grid-cols-[20px_110px_96px_120px_130px_minmax(0,1fr)_minmax(0,1.2fr)] gap-x-4 items-center";

const Chip = ({ className = "", children }: { className?: string; children: React.ReactNode }) => (
  <span className={`px-2 py-0.5 rounded-md text-[11px] ring-1 ring-white/10 text-white/90 ${className}`}>
    {children}
  </span>
);

// ---- Time helpers ----
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function startOfLocalDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfLocalDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

// ---- Weekly availability helpers ----
type Rule = { weekday: number; openMinute: number; closeMinute: number };
type Exception = {
  id: string;
  date: string; // ISO date (UTC midnight)
  openMinute?: number;
  closeMinute?: number;
  blocked: boolean;
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function minToHHMM(m: number) {
  const h = Math.floor(m / 60).toString().padStart(2, "0");
  const mm = (m % 60).toString().padStart(2, "0");
  return `${h}:${mm}`;
}
const clampMin = (n: number) => Math.max(0, Math.min(1440, n));

function utcMinToLocalHHMM(ymd: string, utcMin: number) {
  const utcMid = new Date(`${ymd}T00:00:00Z`);
  const utcTime = new Date(utcMid.getTime() + utcMin * 60_000);
  return utcTime.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Berlin",
  });
}
function localHHMMtoUtcMin(ymd: string, hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const localMid = new Date(new Date(`${ymd}T00:00:00`).toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
  const localTime = new Date(localMid);
  localTime.setHours(h, m, 0, 0);
  const utcMid = new Date(`${ymd}T00:00:00Z`).getTime();
  return Math.round((localTime.getTime() - utcMid) / 60_000);
}
function getAnchorYMDForWeekday(weekday: number) {
  const today = new Date();
  const diff = (weekday - today.getDay() + 7) % 7;
  const anchor = new Date(today);
  anchor.setDate(today.getDate() + diff);
  return anchor.toISOString().slice(0, 10);
}

const DEFAULT_OPEN = 13 * 60;
const DEFAULT_CLOSE = 24 * 60;

// ===================== HUB PAGE =====================
export default function AdminHubPage() {
  // ---- Bookings ----
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [err, setErr] = useState("");

  // ---- Students & LP movers ----
  const [students, setStudents] = useState<Student[]>([]);
  const [movers, setMovers] = useState<{ s: Student; delta: number }[]>([]);
  const [loadingMovers, setLoadingMovers] = useState(true);

  // ---- Availability ----
  const [rules, setRules] = useState<Rule[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [loadingAvail, setLoadingAvail] = useState(true);
  const [uniformOpen, setUniformOpen] = useState("13:00");
  const [uniformClose, setUniformClose] = useState("23:59");
  const [uniformFullDay, setUniformFullDay] = useState(false);

  // ---- Initial fetches ----
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoadingBookings(true);
        const res = await fetch(`/api/admin/bookings?range=all`, { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as BookingRow[];
        if (on) setBookings(data);
      } catch (e: any) {
        if (on) setErr(`Bookings failed: ${e?.message ?? e}`);
      } finally {
        if (on) setLoadingBookings(false);
      }
    })();
    return () => {
      on = false;
    };
  }, []);

  // Students + movers (tries 7d endpoint first, falls back to since-session)
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoadingMovers(true);
        const r = await fetch("/api/admin/students", { cache: "no-store" });
        const j = await r.json();
        const list: Student[] = (j.students ?? []).map((s: any) => ({
          id: String(s.id),
          name: String(s.name ?? ""),
          discordName: s.discordName ?? null,
          riotTag: s.riotTag ?? null,
          server: s.server ?? null,
          createdAt: typeof s.createdAt === "string" ? s.createdAt : new Date(s.createdAt).toISOString(),
          updatedAt: typeof s.updatedAt === "string" ? s.updatedAt : new Date(s.updatedAt).toISOString(),
        }));
        if (!on) return;
        setStudents(list);

        const results = await Promise.all(
          list.map(async (s) => {
            try {
              let r = await fetch(`/api/climb-since?studentId=${encodeURIComponent(s.id)}&days=7`);
              if (!r.ok) throw new Error("fallback");
              const a = (await r.json()) as ClimbResp;
              const d = a?.delta7d ?? a?.overall?.deltaToLatest ?? 0;
              return { s, delta: Number(d) || 0 };
            } catch {
              try {
                const r2 = await fetch(`/api/climb-since-session?studentId=${encodeURIComponent(s.id)}`);
                const b = (await r2.json()) as ClimbResp;
                const d = b?.overall?.deltaToLatest ?? 0;
                return { s, delta: Number(d) || 0 };
              } catch {
                return { s, delta: 0 };
              }
            }
          })
        );
        if (!on) return;
        const top = results.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 3);
        setMovers(top);
      } finally {
        if (on) setLoadingMovers(false);
      }
    })();
    return () => {
      on = false;
    };
  }, []);

  // Availability bootstrap
  useEffect(() => {
    (async () => {
      setLoadingAvail(true);
      try {
        const [r, e] = await Promise.all([
          fetch("/api/admin/availability/rules").then((r) => r.json()),
          fetch("/api/admin/availability/exceptions").then((r) => r.json()),
        ]);

        const byDay = new Map<number, Rule>();
        (r as Rule[]).forEach((row) => byDay.set(row.weekday, row));
        const normalized: Rule[] = Array.from({ length: 7 }, (_, weekday) => {
          const u = byDay.get(weekday);
          return {
            weekday,
            openMinute: clampMin(u?.openMinute ?? DEFAULT_OPEN),
            closeMinute: clampMin(u?.closeMinute ?? DEFAULT_CLOSE),
          };
        });
        setRules(normalized);

        const sample = normalized[1] ?? normalized[0];
        const ymd = getAnchorYMDForWeekday(sample.weekday);
        const openHH = utcMinToLocalHHMM(ymd, sample.openMinute);
        const closeHH = sample.closeMinute >= 1440 ? "23:59" : utcMinToLocalHHMM(ymd, sample.closeMinute);
        setUniformOpen(openHH);
        setUniformClose(closeHH);
        setUniformFullDay(sample.closeMinute >= 1440);

        setExceptions(e as Exception[]);
      } catch (e: any) {
        setErr((p) => p + `\nAvailability failed: ${e?.message ?? e}`);
      } finally {
        setLoadingAvail(false);
      }
    })();
  }, []);

  // ---- Derived booking lists ----
  const today = new Date();
  const tomorrow = useMemo(() => {
    const t = new Date(today);
    t.setDate(t.getDate() + 1);
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sessionsToday = useMemo(() => {
    const s = startOfLocalDay(today).getTime();
    const e = endOfLocalDay(today).getTime();
    return bookings
      .filter((b) => {
        const t = new Date(b.scheduledStart).getTime();
        return t >= s && t <= e;
      })
      .sort((a, b) => +new Date(a.scheduledStart) - +new Date(b.scheduledStart));
  }, [bookings]);

  const sessionsTomorrow = useMemo(() => {
    const s = startOfLocalDay(tomorrow).getTime();
    const e = endOfLocalDay(tomorrow).getTime();
    return bookings
      .filter((b) => {
        const t = new Date(b.scheduledStart).getTime();
        return t >= s && t <= e;
      })
      .sort((a, b) => +new Date(a.scheduledStart) - +new Date(b.scheduledStart));
  }, [bookings, tomorrow]);

  // ---- Uniform save ----
  async function saveRules() {
    const toSend = Array.from({ length: 7 }, (_, weekday) => {
      const ymd = getAnchorYMDForWeekday(weekday);
      const openMinUtc = localHHMMtoUtcMin(ymd, uniformOpen);
      const closeMinUtc = uniformFullDay ? 1440 : localHHMMtoUtcMin(ymd, uniformClose);
      const open = minToHHMM(clampMin(openMinUtc));
      const close = uniformFullDay || closeMinUtc >= 1440 ? "24:00" : minToHHMM(clampMin(closeMinUtc));
      return { open, close };
    });

    const res = await fetch("/api/admin/availability/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rules: toSend }),
    });

    if (!res.ok) alert("Failed to save weekly rules");
  }

  // ---- Exceptions ----
  const [exDate, setExDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [exOpen, setExOpen] = useState("13:00");
  const [exClose, setExClose] = useState("15:00");
  const [exBlocked, setExBlocked] = useState(false);

  async function addException(ex: { date: string; blocked: boolean; open?: string; close?: string }) {
    const res = await fetch("/api/admin/availability/exceptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ex),
    });
    if (!res.ok) return alert("Failed to save exception");
    const e = await fetch("/api/admin/availability/exceptions").then((r) => r.json());
    setExceptions(e as Exception[]);
  }

  async function deleteException(id: string) {
    const res = await fetch(`/api/admin/availability/exceptions?id=${id}`, { method: "DELETE" });
    if (!res.ok) return alert("Failed to delete exception");
    setExceptions((prev) => prev.filter((x) => x.id !== id));
  }

  // ===================== UI =====================
  return (
    <main className="relative min-h-screen text-white overflow-x-clip">
      {/* BG — match your other pages */}
      <div
        aria-hidden
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 22% 18%, rgba(0,130,255,0.28), transparent 58%)," +
            "radial-gradient(circle at 78% 32%, rgba(255,100,30,0.24), transparent 58%)," +
            "radial-gradient(circle at 25% 82%, rgba(0,130,255,0.20), transparent 58%)," +
            "radial-gradient(circle at 80% 75%, rgba(255,100,30,0.18), transparent 58%)",
        }}
      />
      <div
        aria-hidden
        className="fixed inset-0 z-0 opacity-25 mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: "url('/images/coaching/texture.png')", backgroundRepeat: "repeat" }}
      />

      <div className="relative z-10 pb-20">
        <div className="mx-auto w-full max-w-5xl px-6 space-y-8">
          <div className="h-1" />
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-semibold">Daily Hub</h1>
            <div className="text-sm text-white/70">
              Times shown in <span className="text-white/90 font-medium">{TZ}</span>
            </div>
          </div>

          {/* ===== Sessions (Today & Tomorrow) + Top Movers (same row) ===== */}
          <section className="grid gap-4 md:grid-cols-3">
            {/* 2/3 width: Today & Tomorrow combined */}
            <div className="md:col-span-2 overflow-hidden rounded-2xl ring-1 ring-white/10 bg-zinc-900/70">
              <div className="sticky top-0 z-10 bg-zinc-900/80 backdrop-blur px-4 py-2 text-xs uppercase text-white/80">
                Today & Tomorrow
              </div>

              {loadingBookings ? (
                <div className="p-4 text-white/80">Loading…</div>
              ) : sessionsToday.length === 0 && sessionsTomorrow.length === 0 ? (
                <div className="p-4 text-white/70">No sessions today or tomorrow.</div>
              ) : (
                <div className="divide-y divide-white/10">
                  {sessionsToday.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-[11px] uppercase tracking-wide text-white/60">Today</div>
                      <ul className="divide-y divide-white/10">
                        {sessionsToday.map((r) => (
                          <SessionRowItem key={r.id} r={r} />
                        ))}
                      </ul>
                    </div>
                  )}

                  {sessionsTomorrow.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-[11px] uppercase tracking-wide text-white/60">Tomorrow</div>
                      <ul className="divide-y divide-white/10">
                        {sessionsTomorrow.map((r) => (
                          <SessionRowItem key={r.id} r={r} />
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 1/3 width: Top Movers (7d) — 3 StudentCards stacked */}
            <div className="md:col-span-1 space-y-3">
              <div className="overflow-hidden rounded-2xl ring-1 ring-white/10 bg-zinc-900/70">
                <div className="sticky top-0 z-10 bg-zinc-900/80 backdrop-blur px-4 py-2 flex items-center justify-between">
                  <h2 className="text-xs uppercase text-white/80">Top Movers (last 7 days)</h2>
                  {!loadingMovers && (
                    <span className="text-[11px] text-white/60">Top 3 by abs. Δ</span>
                  )}
                </div>

                {loadingMovers ? (
                  <div className="p-4 text-white/80">Crunching numbers…</div>
                ) : movers.length === 0 ? (
                  <div className="p-4 text-white/70">No data.</div>
                ) : (
                  <div className="p-3 space-y-3">
                    {movers.map(({ s }) => (
                      <StudentCard key={s.id} student={s} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ===== Availability (Uniform only) ===== */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Availability</h2>
              <div className="text-sm text-white/70">Uniform editor</div>
            </div>

            {/* Uniform Editor */}
            <div className="rounded-2xl p-4 ring-1 ring-white/20 bg-zinc-900/70">
              {loadingAvail ? (
                <div className="text-sm text-white/70">Loading…</div>
              ) : (
                <div className="flex flex-wrap gap-3 items-center">
                  <span className="w-28 opacity-80">All weekdays</span>
                  <input
                    type="time"
                    value={uniformOpen}
                    onChange={(e) => setUniformOpen(e.target.value)}
                    className="bg-neutral-800 px-2 py-1 rounded"
                  />
                  <span>–</span>
                  <input
                    type="time"
                    value={uniformClose}
                    onChange={(e) => setUniformClose(e.target.value)}
                    className="bg-neutral-800 px-2 py-1 rounded"
                    disabled={uniformFullDay}
                  />
                  <label className="flex items-center gap-2 text-sm ml-2">
                    <input
                      type="checkbox"
                      checked={uniformFullDay}
                      onChange={(e) => setUniformFullDay(e.target.checked)}
                    />
                    Full day
                  </label>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={saveRules}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 ring-1 ring-white/20"
              >
                Save Rules
              </button>
            </div>

            {/* Exceptions */}
            <div className="overflow-hidden rounded-2xl ring-1 ring-white/10 bg-zinc-900/70">
              <div className="px-4 py-3 flex items-center justify-between">
                <h3 className="font-semibold">Exceptions</h3>
                <button
                  onClick={async () => {
                    const body = {
                      date: exDate,
                      blocked: exBlocked,
                      open: exBlocked ? undefined : minToHHMM(localHHMMtoUtcMin(exDate, exOpen)),
                      close: exBlocked ? undefined : minToHHMM(localHHMMtoUtcMin(exDate, exClose)),
                    };
                    await addException(body);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 ring-1 ring-white/20 text-sm"
                >
                  + Add Exception
                </button>
              </div>
              <div className="px-4 pb-4 flex flex-wrap gap-3 items-center">
                <input
                  type="date"
                  value={exDate}
                  onChange={(e) => setExDate(e.target.value)}
                  className="bg-neutral-800 px-2 py-1 rounded"
                />
                {!exBlocked && (
                  <>
                    <input
                      type="time"
                      value={exOpen}
                      onChange={(e) => setExOpen(e.target.value)}
                      className="bg-neutral-800 px-2 py-1 rounded"
                    />
                    <input
                      type="time"
                      value={exClose}
                      onChange={(e) => setExClose(e.target.value)}
                      className="bg-neutral-800 px-2 py-1 rounded"
                    />
                  </>
                )}
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={exBlocked}
                    onChange={(e) => setExBlocked(e.target.checked)}
                  />
                  Block entire day
                </label>
              </div>
              <ul className="divide-y divide-white/10">
                {exceptions.map((ex) => {
                  const ymd = ex.date.slice(0, 10);
                  const label = ex.blocked
                    ? "❌ Blocked all day"
                    : `${utcMinToLocalHHMM(ymd, ex.openMinute ?? 0)}–${utcMinToLocalHHMM(
                        ymd,
                        ex.closeMinute ?? 1440
                      )}`;
                  const dateStr = new Date(ymd + "T00:00:00Z").toLocaleDateString("de-DE", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    timeZone: "Europe/Berlin",
                  });
                  return (
                    <li key={ex.id} className="px-4 py-2 flex items-center justify-between">
                      <span className="text-sm">
                        {dateStr} — {label}
                      </span>
                      <button
                        onClick={() => deleteException(ex.id)}
                        className="text-rose-400 hover:text-rose-300 text-sm"
                      >
                        Delete
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          {err && (
            <pre className="bg-black/30 rounded-lg p-3 text-sm text-white/80 whitespace-pre-wrap">
              {err}
            </pre>
          )}
        </div>
      </div>
    </main>
  );
}
