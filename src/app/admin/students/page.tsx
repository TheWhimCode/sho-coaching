// app/admin/students/page.tsx
"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import StudentCard from "./StudentCard";

type Student = {
  id: string;
  name: string;
  discordName: string | null;
  riotTag: string | null;
  server: string | null;
  createdAt: string;
  updatedAt: string;
  latestSessionStart: string | null;
  allChampions: string[]; // ✅
};

function ymKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map((v) => Number(v));
  const d = new Date(y, (m ?? 1) - 1, 1);
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}

export default function StudentsPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const loadedOnce = useRef(false);

  // --- month state (bottom selector) ---
  const now = new Date();
  const curYM = ymKey(now);
  const lastYM = ymKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const [activeOlderMonth, setActiveOlderMonth] = useState<string | null>(null);

  // --- Add Student overlay state ---
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRiot, setNewRiot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  // close on ESC
  useEffect(() => {
    if (!showAdd) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowAdd(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showAdd]);

  const handleCreate = useCallback(async () => {
    setSubmitErr(null);

    const name = newName.trim();
    const riotTag = newRiot.trim() || null;

    if (!name) {
      setSubmitErr("Name is required.");
      return;
    }
    if (riotTag && !/.+#.+/.test(riotTag)) {
      setSubmitErr("Riot tag should look like Name#TAG (e.g. Faker#KR1).");
      return;
    }

    setSubmitting(true);
    try {
      const r = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, riotTag }),
      });

      if (!r.ok) {
        const msg = await r.text();
        throw new Error(msg || `${r.status} ${r.statusText}`);
      }

      const j = await r.json();

      const created: Student = {
        id: String(j.id),
        name: String(j.name ?? ""),
        discordName: j.discordName ?? null,
        riotTag: j.riotTag ?? null,
        server: j.server ?? null,
        createdAt:
          typeof j.createdAt === "string"
            ? j.createdAt
            : new Date(j.createdAt).toISOString(),
        updatedAt:
          typeof j.updatedAt === "string"
            ? j.updatedAt
            : new Date(j.updatedAt).toISOString(),
        latestSessionStart: j.latestSessionStart ?? null,
        allChampions: Array.isArray(j.allChampions) ? j.allChampions : [],
      };

      setStudents((prev) =>
        [created, ...prev].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      );
      setShowAdd(false);
      setNewName("");
      setNewRiot("");
    } catch (e: any) {
      setSubmitErr(e?.message || "Failed to create student.");
    } finally {
      setSubmitting(false);
    }
  }, [newName, newRiot]);

  // --- Fetch students ---
  useEffect(() => {
    if (loadedOnce.current) return;

    const ac = new AbortController();
    setLoading(true);

    (async () => {
      try {
        const r = await fetch("/api/admin/students", {
          cache: "no-store",
          signal: ac.signal,
        });
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);

        const text = await r.text();
        const j = text ? JSON.parse(text) : { students: [] };

        if (ac.signal.aborted) return;

        const list = (j.students ?? []).map((s: any) => ({
          id: String(s.id),
          name: String(s.name ?? ""),
          discordName: s.discordName ?? null,
          riotTag: s.riotTag ?? null,
          server: s.server ?? null,
          createdAt:
            typeof s.createdAt === "string"
              ? s.createdAt
              : new Date(s.createdAt).toISOString(),
          updatedAt:
            typeof s.updatedAt === "string"
              ? s.updatedAt
              : new Date(s.updatedAt).toISOString(),
          latestSessionStart: s.latestSessionStart ?? null,
          allChampions: Array.isArray(s.allChampions) ? s.allChampions : [],
        })) as Student[];

        setStudents(list);
        loadedOnce.current = true;
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          console.error("students fetch failed:", e);
          setStudents([]);
          loadedOnce.current = true;
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  // --- Older months list (Oct 2025 -> older than last month) ---
  const olderMonths = useMemo(() => {
    const start = new Date(2025, 9, 1); // Oct 2025
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const out: string[] = [];
    const d = new Date(lastMonthStart);
    d.setMonth(d.getMonth() - 1); // start at month before last month

    while (d >= start) {
      out.push(ymKey(d));
      d.setMonth(d.getMonth() - 1);
    }
    return out; // newest -> oldest
  }, [curYM, lastYM]);

  useEffect(() => {
    if (activeOlderMonth && !olderMonths.includes(activeOlderMonth)) {
      setActiveOlderMonth(null);
    }
  }, [activeOlderMonth, olderMonths]);

  const matchesSearch = useCallback((x: Student, s: string) => {
    return [x.name, x.discordName ?? "", x.riotTag ?? "", x.server ?? ""].some(
      (v) => v.toLowerCase().includes(s)
    );
  }, []);

  // Top list: ALWAYS current + last month (unless searching, then show search results)
  const topList = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s) return students.filter((x) => matchesSearch(x, s));

    const allowed = new Set<string>([curYM, lastYM]);
    return students.filter((x) => {
      if (!x.latestSessionStart) return false;
      const d = new Date(x.latestSessionStart);
      if (Number.isNaN(d.getTime())) return false;
      return allowed.has(ymKey(d));
    });
  }, [q, students, curYM, lastYM, matchesSearch]);

  // Bottom list: cards for selected older month (disabled during search)
  const olderList = useMemo(() => {
    if (q.trim()) return [];
    if (!activeOlderMonth) return [];
    return students.filter((x) => {
      if (!x.latestSessionStart) return false;
      const d = new Date(x.latestSessionStart);
      if (Number.isNaN(d.getTime())) return false;
      return ymKey(d) === activeOlderMonth;
    });
  }, [q, students, activeOlderMonth]);

  return (
    <main className="relative min-h-screen text-white overflow-x-clip">
      {/* BG LAYERS */}
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

      {/* CONTENT */}
      <div className="relative z-10 pb-20">
        <div className="mx-auto w-full max-w-5xl px-6 space-y-6">
          <div className="h-1" />

          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-semibold">Students</h1>
            <div className="flex items-center gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name / discord / riot tag / server"
                className="w-80 rounded-xl bg-black/40 px-3 py-2 text-sm ring-1 ring-white/15 text-white placeholder:text-white/50 focus:outline-none focus:ring-white/30"
              />
              <button
                onClick={() => setShowAdd(true)}
                className="rounded-xl bg-blue-600/90 hover:bg-blue-600 px-3 py-2 text-sm font-medium ring-1 ring-white/10"
              >
                + Add student
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-sm text-zinc-300">Loading…</div>
          ) : topList.length === 0 ? (
            <div className="text-sm text-zinc-300">No students.</div>
          ) : (
            <ul className="grid auto-rows-fr gap-2 md:gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {topList.map((s) => (
                <li key={s.id}>
                  <StudentCard student={s} />
                </li>
              ))}
            </ul>
          )}

          {/* Older months selector (bottom) - hidden while searching */}
          {!q.trim() && olderMonths.length > 0 && (
            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-between gap-3">

                
              </div>

              <div className="flex flex-wrap gap-2">
                {olderMonths.map((m) => {
                  const active = m === activeOlderMonth;
                  return (
                    <button
                      key={m}
                      onClick={() => setActiveOlderMonth(active ? null : m)}
                      className={`text-xs px-3 py-1 rounded-lg ring-1 transition ${
                        active
                          ? "bg-blue-600/80 ring-blue-400/40"
                          : "bg-zinc-800/60 ring-white/10 hover:bg-zinc-700/60"
                      }`}
                    >
                      {monthLabel(m)}
                    </button>
                  );
                })}
              </div>

              {/* Older month cards show BELOW selector */}
              {activeOlderMonth && (
                <div className="pt-2 space-y-3">
                  <div className="text-xs text-zinc-400">
                    
                  </div>

                  {olderList.length === 0 ? (
                    <div className="text-sm text-zinc-300">No students.</div>
                  ) : (
                    <ul className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {olderList.map((s) => (
                        <li key={s.id}>
                          <StudentCard student={s} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ADD STUDENT OVERLAY */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
          aria-labelledby="add-student-title"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAdd(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/95 p-5 shadow-xl ring-1 ring-white/10">
            <div className="flex items-start justify-between gap-3">
              <h2 id="add-student-title" className="text-lg font-semibold">
                Add student
              </h2>
              <button
                className="text-zinc-400 hover:text-zinc-200"
                onClick={() => setShowAdd(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-sm text-zinc-300">Name</span>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Hide on Bush"
                  className="mt-1 w-full rounded-xl bg-black/40 px-3 py-2 text-sm ring-1 ring-white/15 text-white placeholder:text-white/50 focus:outline-none focus:ring-white/30"
                />
              </label>

              <label className="block">
                <span className="text-sm text-zinc-300">Riot tag</span>
                <input
                  value={newRiot}
                  onChange={(e) => setNewRiot(e.target.value)}
                  placeholder="e.g. Faker#KR1"
                  className="mt-1 w-full rounded-xl bg-black/40 px-3 py-2 text-sm ring-1 ring-white/15 text-white placeholder:text-white/50 focus:outline-none focus:ring-white/30"
                />
                <p className="mt-1 text-[11px] text-zinc-400">
                  Optional. Format: Name#TAG
                </p>
              </label>

              {submitErr && (
                <div className="text-sm text-red-400">{submitErr}</div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowAdd(false)}
                  className="rounded-xl bg-zinc-800 px-3 py-2 text-sm ring-1 ring-white/10 hover:bg-zinc-700"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="rounded-xl bg-blue-600/90 hover:bg-blue-600 px-3 py-2 text-sm font-medium ring-1 ring-white/10 disabled:opacity-60"
                  disabled={submitting}
                >
                  {submitting ? "Creating…" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
