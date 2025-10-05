// src/app/admin/bookings/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import SessionRowItem, { SessionRow } from "./SessionRow";
import { Pencil, X, Check } from "lucide-react";
import { colorsByPreset } from "@/lib/sessions/colors";

type DayGroup = { key: string; label: string; items: SessionRow[] };

// --- helpers copied from original file ---
function pad(n: number) { return String(n).padStart(2, "0"); }
function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
}
function fromLocalInputValue(v: string) {
  // Treat input as local time
  const d = new Date(v);
  return d.toISOString();
}
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
  return d.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function splitUpcomingPast(rows: SessionRow[]) {
  const now = Date.now();
  const upcoming: SessionRow[] = [];
  const past: SessionRow[] = [];
  for (const r of rows)
    (new Date(r.scheduledStart).getTime() >= now ? upcoming : past).push(r);
  upcoming.sort((a, b) => +new Date(a.scheduledStart) - +new Date(b.scheduledStart));
  past.sort((a, b) => +new Date(b.scheduledStart) - +new Date(a.scheduledStart));
  return { upcoming, past };
}
function groupByDay(sorted: SessionRow[]) {
  const map = new Map<string, DayGroup>();
  for (const r of sorted) {
    const k = toLocalDayKey(r.scheduledStart);
    if (!map.has(k))
      map.set(k, {
        key: k,
        label: prettyDayLabel(r.scheduledStart),
        items: [],
      });
    map.get(k)!.items.push(r);
  }
  return [...map.values()];
}

// layout from original page (for the inline editor)
const GRID =
  "grid grid-cols-[20px_190px_96px_120px_130px_minmax(0,1fr)_minmax(0,1.2fr)] gap-x-4 items-center";

// minimal dot (same colors as your presets)
function presetFromSessionType(t: string): keyof typeof colorsByPreset | "custom" {
  const x = t.toLowerCase();
  if (x.includes("instant")) return "instant";
  if (x.includes("signature")) return "signature";
  if (x.includes("vod")) return "vod";
  if (x.includes("custom")) return "custom";
  return "custom";
}
function Dot({ sessionType }: { sessionType: string }) {
  const key = presetFromSessionType(sessionType);
  const preset = colorsByPreset[key] ?? { ring: "#a3a3a3" };
  return (
    <span
      aria-label={sessionType}
      title={sessionType}
      className="inline-block rounded-full"
      style={{ width: 10, height: 10, background: preset.ring }}
    />
  );
}

const Chip = ({ className = "", children }: { className?: string; children: React.ReactNode }) => (
  <span className={`px-2 py-0.5 rounded-md text-[11px] ring-1 ring-white/10 text-white/90 ${className}`}>
    {children}
  </span>
);

// ---------- Page ----------
export default function AdminSessionsPage() {
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [log, setLog] = useState("");
  const [showPast, setShowPast] = useState(false);

  // reschedule state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempWhen, setTempWhen] = useState<string>("");

  useEffect(() => {
    let on = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/sessions?range=all`, { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as SessionRow[];
        if (on) setRows(data);
      } catch (e: any) {
        if (on) setLog(`Failed to load: ${e?.message ?? e}`);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, []);

  const prettyTZ = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const { upcoming, past } = useMemo(() => splitUpcomingPast(rows), [rows]);
  const upcomingGroups = useMemo(() => groupByDay(upcoming), [upcoming]);
  const pastGroups = useMemo(() => groupByDay(past), [past]);

  async function saveReschedule(id: string, localValue: string, durationMinutes?: number) {
    try {
      const newStartIso = fromLocalInputValue(localValue);
      const res = await fetch("/api/admin/sessions/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, newStart: newStartIso, scheduledMinutes: durationMinutes }),
      });
      if (!res.ok) throw new Error(await res.text());
      // reflect locally
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, scheduledStart: new Date(newStartIso).toISOString() } : r))
      );
      setEditingId(null);
    } catch (e: any) {
      setLog(`Reschedule failed: ${e?.message ?? e}`);
    }
  }

  // Inline editor row (shown only when a row is being edited)
  const EditorRow = ({ r }: { r: SessionRow }) => {
    const blocks = r.liveBlocks ?? 0;
    return (
      <li className="px-4 py-3">
        <div className={GRID}>
          {/* dot */}
          <Dot sessionType={r.sessionType} />

          {/* time editor */}
          <div className="flex items-center gap-2 text-white/90 tabular-nums min-w-0">
            <input
              type="datetime-local"
              value={tempWhen}
              onChange={(e) => setTempWhen(e.target.value)}
              className="bg-black/30 ring-1 ring-white/15 rounded px-2 py-1 text-sm"
            />
            <button
              aria-label="Save"
              className="p-1 rounded hover:bg-white/10"
              onClick={() => saveReschedule(r.id, tempWhen, r.liveMinutes)}
              title="Save"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              aria-label="Cancel"
              className="p-1 rounded hover:bg-white/10"
              onClick={() => setEditingId(null)}
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* length */}
          <div>
            <Chip>{r.liveMinutes} min</Chip>
          </div>

          {/* live blocks */}
          <div>
            <Chip>Live Blocks: {blocks}</Chip>
          </div>

          {/* follow-ups */}
          <div>
            <Chip>Follow-ups: {r.followups}</Chip>
          </div>

          {/* discordName */}
          <div className="truncate text-white/90">
            {r.discordName ?? <span className="text-white/40">—</span>}
          </div>

          {/* notes */}
          <div className="text-white/70 text-sm break-words">
            {r.notes ? r.notes : <span className="text-white/35">—</span>}
          </div>
        </div>
      </li>
    );
  };

  // Group with edit support: if editingId matches row -> editor, else -> imported component with an Edit button
  const Group = ({ g }: { g: DayGroup }) => (
    <section className="overflow-hidden rounded-2xl ring-1 ring-white/10 bg-zinc-900/70">
      <div className="sticky top-0 z-10 bg-zinc-900/80 backdrop-blur px-4 py-2">
        <span className="inline-block text-xs tracking-wide uppercase text-white/80">
          {g.label}
        </span>
      </div>
      <ul className="divide-y divide-white/10">
        {g.items.map((r) =>
          editingId === r.id ? (
            <EditorRow key={r.id} r={r} />
          ) : (
            // NOTE: SessionRowItem is assumed to accept an optional onEdit prop.
            // If your current component doesn't, you can add the small edit button inside it,
            // or replace this with a local wrapper that renders the pencil next to the time.
            <SessionRowItem
              key={r.id}
              r={r}
              onEdit={() => {
                setEditingId(r.id);
                setTempWhen(toLocalInputValue(r.scheduledStart));
              }}
              editIcon={<Pencil className="h-4 w-4" />}
              editAriaLabel="Reschedule"
              editTitle="Reschedule"
            />
          )
        )}
      </ul>
    </section>
  );

  return (
    <main className="relative min-h-screen text-white overflow-x-clip">
      {/* BG LAYERS — match students pages */}
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
        style={{
          backgroundImage: "url('/images/coaching/texture.png')",
          backgroundRepeat: "repeat",
        }}
      />

      {/* CONTENT WRAPPER — 5xl + 24px side padding */}
      <div className="relative z-10 pb-20">
        <div className="mx-auto w-full max-w-5xl px-6 space-y-6">
          <div className="h-1" />

          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-semibold">Sessions</h1>
            <div className="text-sm text-white/70">
              Times shown in{" "}
              <span className="text-white/90 font-medium">
                {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </span>
            </div>
          </div>

          {/* Upcoming */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Upcoming</h2>
              <div className="text-sm text-white/60">
                {loading ? "Loading…" : `${splitUpcomingPast(rows).upcoming.length} session${
                  splitUpcomingPast(rows).upcoming.length === 1 ? "" : "s"
                }`}
              </div>
            </div>

            {loading ? (
              <div className="p-4 text-white/80 bg-zinc-900/70 rounded-2xl ring-1 ring-white/10">
                Loading…
              </div>
            ) : splitUpcomingPast(rows).upcoming.length === 0 ? (
              <div className="p-4 text-white/80 bg-zinc-900/70 rounded-2xl ring-1 ring-white/10">
                Nothing upcoming.
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingGroups.map((g) => (
                  <Group key={g.key} g={g} />
                ))}
              </div>
            )}
          </section>

          {/* Past */}
          <section className="space-y-3">
            <button
              onClick={() => setShowPast((v) => !v)}
              className="w-full flex items-center justify-between rounded-xl px-4 py-3 bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition"
            >
              <span className="text-base font-semibold">Past</span>
              <span className="text-sm text-white/70">
                {loading ? "…" : `${splitUpcomingPast(rows).past.length} session${
                  splitUpcomingPast(rows).past.length === 1 ? "" : "s"
                }`}{" "}
                {showPast ? "▲" : "▼"}
              </span>
            </button>

            {showPast && (
              <div className="space-y-4">
                {loading ? (
                  <div className="p-4 text-white/80 bg-zinc-900/70 rounded-2xl ring-1 ring-white/10">
                    Loading…
                  </div>
                ) : splitUpcomingPast(rows).past.length === 0 ? (
                  <div className="p-4 text-white/80 bg-zinc-900/70 rounded-2xl ring-1 ring-white/10">
                    No past sessions yet.
                  </div>
                ) : (
                  pastGroups.map((g) => <Group key={g.key} g={g} />)
                )}
              </div>
            )}
          </section>

          {log && <pre className="bg-black/30 rounded-lg p-3 text-sm text-white/80">{log}</pre>}
        </div>
      </div>
    </main>
  );
}
