'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import type { Student, Session as PrismaSession } from '@prisma/client';
import DocTemplate from './_components/DocTemplate';
import { defaultTitle, buildDefaultMd } from './_components/noteDefaults';

export type NoteSession = {
  id: string;        // session id if exists, else doc id like "doc-<n>"
  number: number;    // 1..n per student
  title: string;     // ALWAYS derived from Session.sessionType (fallback to default)
  content: string;   // markdown
  createdAt: string; // ISO
};

type Props = {
  student: Student;
  sessions: PrismaSession[];
  onCreateSession?: (s: NoteSession) => void;
  onUpdateSession?: (s: NoteSession) => void; // parent persists using studentId + number
};

export default function SessionNotes({
  student,
  sessions,
  onCreateSession,
  onUpdateSession,
}: Props) {
  // Ensure sessions are ordered chronologically by scheduledStart (or createdAt)
  const sortedSessions = useMemo(
    () =>
      [...(sessions ?? [])].sort((a, b) => {
        const aTime = (a.scheduledStart ?? a.createdAt).getTime();
        const bTime = (b.scheduledStart ?? b.createdAt).getTime();
        return aTime - bTime;
      }),
    [sessions]
  );

  const [local, setLocal] = useState<NoteSession[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const active = local.find((s) => s.id === activeId) ?? local[0];

  // Load docs (numbers) + contents; overlay Session info if present
  useEffect(() => {
    let aborted = false;
    if (!student?.id) return;

    (async () => {
      try {
        const listRes = await fetch(
          `/api/session-docs?studentId=${encodeURIComponent(student.id)}`,
          { cache: 'no-store' }
        );
        const listJson = listRes.ok ? await listRes.json() : { docs: [] as Array<{ id: string; number: number }> };
        const docs: Array<{ id: string; number: number }> = listJson?.docs ?? [];

        // Helper: title always from DB sessionType for the nth session; fallback to defaultTitle(n)
        const titleFromDb = (n: number) => {
          const session = sortedSessions[n - 1];
          const t = (session?.sessionType ?? '').trim();
          return t || defaultTitle(n);
        };

        if (!docs.length) {
          // No docs stored yet — seed from sessions only
          const mapped = sortedSessions.map((s, i) => {
            const n = i + 1;
            const content = s.notes ?? buildDefaultMd(); // was s.summary; keep your own field
            const title = titleFromDb(n);
            return {
              id: String(s.id),
              number: n,
              title,
              content,
              createdAt:
                s.createdAt instanceof Date
                  ? s.createdAt.toISOString()
                  : (s.createdAt as any) ?? new Date().toISOString(),
            } as NoteSession;
          });
          if (aborted) return;
          const seed =
            mapped.length
              ? mapped
              : [{
                  id: 'doc-1',
                  number: 1,
                  title: titleFromDb(1),
                  content: buildDefaultMd(),
                  createdAt: new Date().toISOString(),
                }];
          setLocal(seed);
          setActiveId(seed[0]?.id ?? 'doc-1');
          return;
        }

        // Docs exist — fetch contents, but ignore any doc.notes.title
        const details = await Promise.all(
          docs.map(async (d) => {
            try {
              const r = await fetch(
                `/api/session-docs/${encodeURIComponent(student.id)}?number=${d.number}`,
                { cache: 'no-store' }
              );
              if (!r.ok) return null;
              const j = await r.json();
              return j?.doc as { id: string; number: number; notes: any; updatedAt?: string };
            } catch {
              return null;
            }
          })
        );

        const items: NoteSession[] = details
          .filter(Boolean)
          .map((doc) => {
            const n = doc!.number;
            const raw = doc!.notes;

            let content = '';
            if (raw && typeof raw === 'object' && ('md' in raw)) {
              content = (raw as any).md ?? '';
            } else if (typeof raw === 'string') {
              content = raw;
            } else {
              content = buildDefaultMd();
            }

            const session = sortedSessions[n - 1];
            const id = session ? String(session.id) : `doc-${n}`;
            const createdAt = session
              ? (session.createdAt instanceof Date
                  ? session.createdAt.toISOString()
                  : (session.createdAt as any) ?? new Date().toISOString())
              : new Date().toISOString();

            return {
              id,
              number: n,
              title: titleFromDb(n),   // ALWAYS from DB sessionType
              content,
              createdAt,
            };
          })
          .sort((a, b) => a.number - b.number);

        if (aborted) return;
        setLocal(items);
        setActiveId(items[0]?.id ?? '');
      } catch {
        if (aborted) return;
        setLocal([{
          id: 'doc-1',
          number: 1,
          title: (sortedSessions[0]?.sessionType ?? '').trim() || defaultTitle(1),
          content: buildDefaultMd(),
          createdAt: new Date().toISOString(),
        }]);
        setActiveId('doc-1');
      }
    })();

    return () => {
      aborted = true;
    };
  }, [student?.id, sortedSessions]);

  // Create a new doc on the server immediately
  const createSession = async () => {
    if (!student?.id) return;
    const fallbackNumber = (local.reduce((m, x) => Math.max(m, x.number), 0) || 0) + 1;
    const md = buildDefaultMd();

    let newId = `doc-${Date.now()}`;
    let newNumber = fallbackNumber;

    try {
      const res = await fetch('/api/session-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Do NOT send a title; we ignore titles in notes
        body: JSON.stringify({ studentId: student.id, notes: { md } }),
      });
      if (res.ok) {
        const { doc } = await res.json();
        newId = doc.id;
        newNumber = doc.number;
      }
    } catch {}

    const title = (sortedSessions[newNumber - 1]?.sessionType ?? '').trim() || defaultTitle(newNumber);

    const s: NoteSession = {
      id: newId,
      number: newNumber,
      title,
      content: md,
      createdAt: new Date().toISOString(),
    };

    setLocal((xs) => [...xs, s].sort((a, b) => a.number - b.number));
    setActiveId(s.id);
    onCreateSession?.(s);
  };

  // Patch active and bubble up (parent persists by studentId + number)
  const patchActive = (patch: Partial<NoteSession>) => {
    const current = local.find((s) => s.id === activeId);
    if (!current) return;

    // Never allow title changes; strip it if present in patch
    const { title: _ignoreTitle, ...rest } = patch as any;
    const updated: NoteSession = { ...current, ...rest };
    setLocal((xs) => xs.map((s) => (s.id === current.id ? updated : s)));
    onUpdateSession?.(updated);
  };

  return (
    <div className="flex gap-6">
      <aside className="w-56 shrink-0">
        <div className="flex flex-col gap-3">
          <button
            onClick={createSession}
            className="inline-flex items-center gap-2 h-12 px-4 w-full rounded-xl bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700 transition"
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">New session</span>
          </button>

          {local.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={`inline-flex items-center gap-2 text-left h-12 px-4 w-full rounded-xl border transition ${
                activeId === s.id
                  ? 'bg-zinc-900 text-white border-zinc-600 ring-2 ring-zinc-500/40'
                  : 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700'
              }`}
              title={s.title}
            >
              <FileText className="h-5 w-5 opacity-90" />
              <span className="truncate font-medium">#{s.number} — {s.title}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="grow rounded-2xl border border-white/10 bg-white/5 p-6 min-h-[480px]">
        {active ? (
          <DocTemplate session={active} onChange={(p) => patchActive(p)} />
        ) : (
          <div className="text-zinc-400">No session selected.</div>
        )}
      </section>
    </div>
  );
}
