// src/app/admin/students/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Student = {
  id: string;
  name: string;
  discord: string | null;
  riotTag: string | null;
  server: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function StudentsPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/students")
      .then((r) => r.json())
      .then((j) =>
        setStudents(
          (j.students || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            discord: s.discord,
            riotTag: s.riotTag,
            server: s.server,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
          }))
        )
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return students;
    return students.filter((x) =>
      [x.name, x.discord ?? "", x.riotTag ?? "", x.server ?? ""].some((v) =>
        v.toLowerCase().includes(s)
      )
    );
  }, [q, students]);

  return (
    <div className="px-70 py-20 space-y-4">
      {/* padding 60px on all sides */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Students</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name / discord / riot tag / server"
          className="w-80 rounded-xl bg-black/40 px-3 py-2 text-sm ring-1 ring-white/15 focus:outline-none focus:ring-white/30"
        />
      </div>

      {loading ? (
        <div className="text-sm text-zinc-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-zinc-400">No students.</div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <li key={s.id}>
              <Link
                href={`/admin/students/${s.id}`}
                className="block rounded-2xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700 transition"
              >
                {/* Large name */}
                <div className="text-lg font-semibold tracking-tight">{s.name}</div>
                {/* Smaller meta row */}
                <div className="mt-1 text-xs text-zinc-400 flex flex-wrap gap-x-3 gap-y-1">
                  <span>
                    Discord:{" "}
                    <span className="text-zinc-200">{s.discord || "—"}</span>
                  </span>
                  <span>
                    Riot:{" "}
                    <span className="text-zinc-200">{s.riotTag || "—"}</span>
                  </span>
                  <span>
                    Server:{" "}
                    <span className="text-zinc-200 uppercase">
                      {s.server || "—"}
                    </span>
                  </span>
                </div>
                {/* Subtle updated timestamp */}
                <div className="mt-2 text-[11px] text-zinc-500">
                  Updated {new Date(s.updatedAt).toLocaleString()}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
