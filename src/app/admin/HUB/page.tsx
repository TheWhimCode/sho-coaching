// src/app/admin/hub/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import SessionRowItem from "@/app/admin/sessions/SessionRow";
import { SessionData } from "@/app/admin/sessions/SessionData";
import StudentCard from "@/app/admin/students/StudentCard";

type Student = {
  id: string;
  name: string;
  discordName: string | null;
  riotTag: string | null;
  server: string | null;
  createdAt: string;
  updatedAt: string;
};

const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

export default function AdminHubPage() {
  // ---- Sessions ----
  const [bookings, setBookings] = useState<SessionData[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // ---- Movers ----
const [movers, setMovers] = useState<{ student: Student; delta: number }[]>([]);
  const [loadingMovers, setLoadingMovers] = useState(true);

  // ---- Fetch upcoming sessions ----
  useEffect(() => {
    let on = true;

    (async () => {
      try {
        setLoadingBookings(true);
        const res = await fetch(`/api/admin/sessions?range=upcoming`, {
          cache: "no-store",
        });

        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as SessionData[];

        if (on) setBookings(data);
      } finally {
        if (on) setLoadingBookings(false);
      }
    })();

    return () => {
      on = false;
    };
  }, []);

  // ---- Fetch top movers (via optimized backend route) ----
  useEffect(() => {
    let on = true;

    (async () => {
      try {
        setLoadingMovers(true);

        const res = await fetch("/api/admin/students/top-movers?days=7", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(await res.text());

        const data = await res.json(); // expecting array of 3 students
        if (on) setMovers(data.students ?? []);
      } finally {
        if (on) setLoadingMovers(false);
      }
    })();

    return () => {
      on = false;
    };
  }, []);

  const nextThree = useMemo(() => {
    return [...bookings]
      .filter((b) => new Date(b.scheduledStart).getTime() >= Date.now())
      .sort(
        (a, b) =>
          +new Date(a.scheduledStart) - +new Date(b.scheduledStart),
      )
      .slice(0, 3);
  }, [bookings]);

  // ===================== UI =====================
  return (
    <main className="relative min-h-screen text-white overflow-x-clip">
      {/* BG */}
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

      <div className="relative z-10 pb-20">
        <div className="mx-auto w-full max-w-5xl px-6 space-y-8">
          <div className="h-1" />
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-semibold">Daily Hub</h1>
            <div className="text-sm text-white/70">
              Times shown in{" "}
              <span className="text-white/90 font-medium">{TZ}</span>
            </div>
          </div>

          {/* ===== sessions + movers ===== */}
          <section className="grid gap-4 md:grid-cols-3">
            {/* Left: next 3 sessions */}
            <div className="md:col-span-2 overflow-hidden rounded-2xl ring-1 ring-white/10 bg-zinc-900/70">
              <div className="sticky top-0 bg-zinc-900/80 backdrop-blur px-4 py-2 text-xs uppercase text-white/80">
                Next 3 Sessions
              </div>

              {loadingBookings ? (
                <div className="p-4 text-white/80">Loading…</div>
              ) : nextThree.length === 0 ? (
                <div className="p-4 text-white/70">
                  No upcoming sessions.
                </div>
              ) : (
                <ul className="divide-y divide-white/10">
                  {nextThree.map((r) => (
                    <SessionRowItem key={r.id} r={r} onReschedule={async () => {}} />
                  ))}
                </ul>
              )}
            </div>

            {/* Right: top movers */}
            <div className="md:col-span-1 space-y-3">
              <div className="overflow-hidden rounded-2xl ring-1 ring-white/10 bg-zinc-900/70">
                <div className="sticky top-0 bg-zinc-900/80 backdrop-blur px-4 py-2 flex items-center justify-between">
                  <h2 className="text-xs uppercase text-white/80">
                    Top Movers (last 7 days)
                  </h2>
                  {!loadingMovers && (
                    <span className="text-[11px] text-white/60">
                      Top 3 by abs. Δ
                    </span>
                  )}
                </div>

                {loadingMovers ? (
                  <div className="p-4 text-white/80">Crunching numbers…</div>
                ) : movers.length === 0 ? (
                  <div className="p-4 text-white/70">No data.</div>
                ) : (
                  <div className="p-3 space-y-3">
{movers.map(({ student, delta }) => (
  <StudentCard key={student.id} student={student} lpDelta={delta} />
))}


                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
