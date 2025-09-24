// src/app/admin/students/_components/SessionNotes.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import type { Student, Session as PrismaSession } from '@prisma/client';
import DocTemplate from './_components/DocTemplate';
import { defaultTitle, buildDefaultMd } from './_components/noteDefaults';

export type NoteSession = {
  id: string;        // session id if exists, else doc id like "doc-<n>"
  number: number;    // 1..n per student
  title: string;     // independent, editable (not from markdown)
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
  const sortedSessions = useMemo(
    () =>
      [...(sessions ?? [])].sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      ),
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

        if (!docs.length) {
          const mapped = sortedSessions.map((s, i) => {
            const n = i + 1;
            const content = s.summary ?? buildDefaultMd();
            const title = defaultTitle(n);
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
              : [{ id: 'doc-1', number: 1, title: defaultTitle(1), content: buildDefaultMd(), createdAt: new Date().toISOString() }];
          setLocal(seed);
          setActiveId(seed[0]?.id ?? 'doc-1');
          return;
        }

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
            let title = defaultTitle(n);
            if (raw && typeof raw === 'object' && ('md' in raw || 'title' in raw)) {
              content = (raw as any).md ?? '';
              title = (raw as any).title || title;
            } else if (typeof raw === 'string') {
              content = raw;
            } else {
              content = buildDefaultMd();
            }
            const session = sortedSessions[n - 1];
            return {
              id: session ? String(session.id) : `doc-${n}`,
              number: n,
              title,
              content,
              createdAt: session
                ? (session.createdAt instanceof Date
                    ? session.createdAt.toISOString()
                    : (session.createdAt as any) ?? new Date().toISOString())
                : new Date().toISOString(),
            };
          })
          .sort((a, b) => a.number - b.number);

        if (aborted) return;
        setLocal(items);
        setActiveId(items[0]?.id ?? '');
      } catch {
        if (aborted) return;
        setLocal([{ id: 'doc-1', number: 1, title: defaultTitle(1), content: buildDefaultMd(), createdAt: new Date().toISOString() }]);
        setActiveId('doc-1');
      }
    })();

    return () => {
      aborted = true;
    };
  }, [student?.id, sortedSessions.length]);

  // Create a new doc on the server immediately
  const createSession = async () => {
    if (!student?.id) return;
    const fallbackNumber = (local.reduce((m, x) => Math.max(m, x.number), 0) || 0) + 1;
    const md = buildDefaultMd();
    const title = defaultTitle(fallbackNumber);

    let newId = `doc-${Date.now()}`;
    let newNumber = fallbackNumber;
    let newTitle = title;

    try {
      const res = await fetch('/api/session-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id, notes: { md, title } }),
      });
      if (res.ok) {
        const { doc } = await res.json();
        newId = doc.id;
        newNumber = doc.number;
        if (doc?.notes && typeof doc.notes === 'object' && 'title' in doc.notes) {
          newTitle = String(doc.notes.title);
        }
      }
    } catch {}

    const s: NoteSession = {
      id: newId,
      number: newNumber,
      title: newTitle,
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
    const updated: NoteSession = { ...current, ...patch };
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
