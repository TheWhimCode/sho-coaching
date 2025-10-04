"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import useSWR from "swr";
import Link from "next/link";

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
};

const climbFetcher = (url: string) =>
  fetch(url).then((r) => r.json() as Promise<ClimbResp>);

function LPBadge({ studentId }: { studentId: string }) {
  const { data } = useSWR<ClimbResp>(
    `/api/admin/students/climb-since-session?studentId=${encodeURIComponent(studentId)}`,
    climbFetcher
  );

  const delta = data?.overall?.deltaToLatest;
  const hasData = typeof delta === "number";

  const badgeColor = !hasData
    ? "text-zinc-400 bg-zinc-700/20 ring-1 ring-zinc-600/30"
    : delta > 0
    ? "text-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30"
    : delta < 0
    ? "text-red-500 bg-red-500/10 ring-1 ring-red-500/30"
    : "text-zinc-400 bg-zinc-700/20 ring-1 ring-zinc-600/30";

  const formatted = !hasData
    ? "—"
    : delta > 0
    ? `+${delta}`
    : `${delta}`;

  return (
    <span
      className={`ml-auto shrink-0 text-xs px-2 py-0.5 rounded-md font-medium tabular-nums ${badgeColor}`}
      title="LP gained since first session"
    >
      {formatted} LP
    </span>
  );
}

export default function StudentsPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const loadedOnce = useRef(false);

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
    // basic riot tag format hint (optional)
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

      // normalize just like initial fetch does
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

  useEffect(() => {
    if (loadedOnce.current) return;
    loadedOnce.current = true;

    const ac = new AbortController();
    setLoading(true);

    fetch("/api/admin/students", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        const text = await r.text();
        return text ? JSON.parse(text) : { students: [] };
      })
      .then((j) => {
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
        })) as Student[];
        setStudents(list);
      })
      .catch((e) => {
        console.error("students fetch failed:", e);
        setStudents([]);
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return students;
    return students.filter((x) =>
      [x.name, x.discordName ?? "", x.riotTag ?? "", x.server ?? ""].some((v) =>
        v.toLowerCase().includes(s)
      )
    );
  }, [q, students]);

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
          ) : filtered.length === 0 ? (
            <div className="text-sm text-zinc-300">No students.</div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/admin/students/${s.id}`}
                    className="block rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 hover:border-zinc-700 transition"
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-semibold tracking-tight">
                        {s.name}
                      </div>
                      <LPBadge studentId={s.id} />
                    </div>
                    <div className="mt-1 text-xs text-zinc-300 flex flex-wrap gap-x-3 gap-y-1">
                      <span>
                        Discord:{" "}
                        <span className="text-zinc-100">
                          {s.discordName || "—"}
                        </span>
                      </span>
                      <span>
                        Riot:{" "}
                        <span className="text-zinc-100">{s.riotTag || "—"}</span>
                      </span>
                      <span>
                        Server:{" "}
                        <span className="text-zinc-100 uppercase">
                          {s.server || "—"}
                        </span>
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] text-zinc-400">
                      Updated {new Date(s.updatedAt).toLocaleString()}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
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
