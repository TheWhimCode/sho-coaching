// src/app/admin/students/page.tsx
"use client";

import { useEffect, useMemo, useState, useRef } from "react";
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
    `/api/climb-since-session?studentId=${encodeURIComponent(studentId)}`,
    climbFetcher
  );

  const delta = data?.overall?.deltaToLatest ?? 0;

  const badgeColor =
    delta > 0
      ? "text-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30"
      : delta < 0
      ? "text-red-500 bg-red-500/10 ring-1 ring-red-500/30"
      : "text-zinc-400 bg-zinc-700/20 ring-1 ring-zinc-600/30";

  const formatted =
    delta > 0 ? `+${delta}` : delta < 0 ? `-${Math.abs(delta)}` : "0";

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

  useEffect(() => {
    if (loadedOnce.current) return;
    loadedOnce.current = true;

    const ac = new AbortController(); // keep exactly as in your original
    setLoading(true);

    fetch("/api/admin/students", { cache: "no-store" }) // NOTE: no signal passed
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
      {/* BG LAYERS — identical to StudentDetailClient */}
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

      {/* CONTENT WRAPPER — same spacing as detail page */}
      <div className="relative z-10 pb-20">
        <div className="mx-auto w-full max-w-5xl px-6 space-y-6">
          <div className="h-1" />

          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-semibold">Students</h1>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name / discord / riot tag / server"
              className="w-80 rounded-xl bg-black/40 px-3 py-2 text-sm ring-1 ring-white/15 text-white placeholder:text-white/50 focus:outline-none focus:ring-white/30"
            />
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
    </main>
  );
}
