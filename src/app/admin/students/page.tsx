// src/app/admin/students/page.tsx
"use client";

import { useEffect, useMemo, useState, useRef } from "react";
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

export default function StudentsPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const loadedOnce = useRef(false);

  useEffect(() => {
    // Guard duplicate runs in React Strict Mode (dev)
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
            typeof s.createdAt === "string" ? s.createdAt : new Date(s.createdAt).toISOString(),
          updatedAt:
            typeof s.updatedAt === "string" ? s.updatedAt : new Date(s.updatedAt).toISOString(),
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
    <div className="relative min-h-screen">
      {/* Fixed background so global navbar spacing doesn't push it */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-purple-900 via-black to-indigo-950" aria-hidden />

      {/* Content sits above; offset comes from layout */}
      <div className="relative z-10 px-16 py-20 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-white">Students</h1>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name / discord name / riot tag / server"
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
                  className="block rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 hover:border-zinc-700 transition text-white"
                >
                  <div className="text-lg font-semibold tracking-tight">{s.name}</div>
                  <div className="mt-1 text-xs text-zinc-300 flex flex-wrap gap-x-3 gap-y-1">
                    <span>
                      Discord: <span className="text-zinc-100">{s.discordName || "—"}</span>
                    </span>
                    <span>
                      Riot: <span className="text-zinc-100">{s.riotTag || "—"}</span>
                    </span>
                    <span>
                      Server: <span className="text-zinc-100 uppercase">{s.server || "—"}</span>
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
  );
}
