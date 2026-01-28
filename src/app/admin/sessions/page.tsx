// src/app/admin/sessions/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import SessionRowItem from "./SessionRow"; // UI
import { SessionData } from "./SessionData"; // type

// ============================================================
// PAGE
// ============================================================
export default function AdminSessionsPage() {
  const [rows, setRows] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [log, setLog] = useState("");
  const [showPast, setShowPast] = useState(false);

  // ------------------ fetch sessions ------------------
  useEffect(() => {
    let on = true;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/sessions?range=all`, { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as SessionData[];
        if (on) setRows(data);
      } catch (e: any) {
        if (on) setLog(`Failed to load: ${e?.message ?? e}`);
      } finally {
        if (on) setLoading(false);
      }
    })();

    return () => {
      on = false;
    };
  }, []);

  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  // ------------------ split upcoming & past ------------------
  const now = Date.now();
  const upcoming = rows
    .filter((r) => new Date(r.scheduledStart).getTime() >= now)
    .sort((a, b) => +new Date(a.scheduledStart) - +new Date(b.scheduledStart));

  const past = rows
    .filter((r) => new Date(r.scheduledStart).getTime() < now)
    .sort((a, b) => +new Date(b.scheduledStart) - +new Date(a.scheduledStart));

  // ------------------ reschedule handler ------------------
  async function onReschedule(id: string, newStartISO: string) {
    try {
      const res = await fetch("/api/admin/availability/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, newStart: newStartISO }),
      });

      if (!res.ok) throw new Error(await res.text());

      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, scheduledStart: newStartISO } : r))
      );
    } catch (e: any) {
      setLog(`Reschedule failed: ${e?.message ?? e}`);
    }
  }

  // ============================================================
  // UI
  // ============================================================
  return (
    <main className="relative min-h-screen text-white overflow-x-clip">
      {/* background */}
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

      {/* content */}
      <div className="relative z-10 pb-20">
        <div className="mx-auto w-full max-w-5xl px-6 space-y-6">
          <div className="h-1" />

          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Sessions</h1>
            <div className="text-sm text-white/70">
              Times shown in <span className="text-white/90 font-medium">{tz}</span>
            </div>
          </div>

          {/* UPCOMING */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Upcoming</h2>
              <div className="text-sm text-white/60">
                {loading ? "Loading…" : `${upcoming.length} session${upcoming.length === 1 ? "" : "s"}`}
              </div>
            </div>

            {loading ? (
              <div className="p-4 bg-zinc-900/70 rounded-2xl ring-1 ring-white/10 text-white/80">
                Loading…
              </div>
            ) : upcoming.length === 0 ? (
              <div className="p-4 bg-zinc-900/70 rounded-2xl ring-1 ring-white/10 text-white/80">
                Nothing upcoming.
              </div>
            ) : (
              /* UPCOMING LIST REMAINS UNCHANGED */
              <ul className="divide-y divide-white/10 overflow-hidden rounded-2xl ring-1 ring-white/10 bg-zinc-900/70">
                {upcoming.map((r) => (
                  <SessionRowItem key={r.id} r={r} onReschedule={onReschedule} />
                ))}
              </ul>
            )}
          </section>

          {/* PAST */}
          <section className="space-y-3">
            <div className="w-full rounded-xl bg-white/5 ring-1 ring-white/10">
              <button
                onClick={() => setShowPast((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/10 transition"
              >
                <span className="text-base font-semibold">Past</span>
                <span className="text-sm text-white/70">
                  {loading ? "…" : `${past.length} session${past.length === 1 ? "" : "s"}`}{" "}
                  {showPast ? "▲" : "▼"}
                </span>
              </button>

              {showPast && (
                <div className=" pt-1">
                  {loading ? (
                    <div className="p-4 bg-zinc-900/70 rounded-2xl ring-1 ring-white/10 text-white/80">
                      Loading…
                    </div>
                  ) : past.length === 0 ? (
                    <div className="p-4 bg-zinc-900/70 rounded-2xl ring-1 ring-white/10 text-white/80">
                      No past sessions.
                    </div>
                  ) : (
                    /* ONLY CHANGE: wrapper removed */
                    <ul className="divide-y divide-white/10">
                      {past.map((r) => (
                        <SessionRowItem key={r.id} r={r} onReschedule={onReschedule} />
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </section>

          {log && (
            <pre className="bg-black/30 rounded-lg p-3 text-sm text-white/80 whitespace-pre-wrap">
              {log}
            </pre>
          )}
        </div>
      </div>
    </main>
  );
}
