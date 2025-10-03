'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import type { Student, Session as PrismaSession } from '@prisma/client';
import DocTemplate from './_components/DocTemplate';
import { defaultTitle, buildDefaultMd } from './_components/noteDefaults';

export type NoteSession = {
  id: string;
  number: number;
  title: string;
  content: string;
  createdAt: string;
};

type Props = {
  student: Student;
  sessions: PrismaSession[];
  onCreateSession?: (s: NoteSession) => void; // unused now
  onUpdateSession?: (s: NoteSession) => void;
};

function sessionDate(s: PrismaSession) {
  const dt = (s as any).scheduledStart ?? s.createdAt;
  return dt instanceof Date ? dt : new Date(dt);
}

export default function SessionNotes({
  student,
  sessions,
  onUpdateSession,
}: Props) {
  const sortedSessions = useMemo(
    () =>
      [...(sessions ?? [])].sort((a, b) => {
        const aTime = sessionDate(a).getTime();
        const bTime = sessionDate(b).getTime();
        return aTime - bTime;
      }),
    [sessions]
  );

  const [local, setLocal] = useState<NoteSession[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const active = local.find((s) => s.id === activeId) ?? local[0];

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
            const content = (s as any).notes ?? buildDefaultMd();
            const title = (s as any).sessionType?.trim() || defaultTitle(n);
            return {
              id: String(s.id),
              number: n,
              title,
              content,
              createdAt: sessionDate(s).toISOString(),
            } as NoteSession;
          });

          if (aborted) return;

          const seed =
            mapped.length
              ? mapped
              : [{
                  id: 'doc-1',
                  number: 1,
                  title: defaultTitle(1),
                  content: buildDefaultMd(),
                  createdAt: new Date().toISOString(),
                }];

          setLocal(seed);
          setActiveId(seed[seed.length - 1]?.id ?? 'doc-1');
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
            const sessionType = (session as any)?.sessionType?.trim();
            const finalTitle = sessionType || title;

            return {
              id: session ? String(session.id) : `doc-${n}`,
              number: n,
              title: finalTitle,
              content,
              createdAt: session ? sessionDate(session).toISOString() : new Date().toISOString(),
            };
          })
          .sort((a, b) => a.number - b.number);

        if (aborted) return;
        setLocal(items);
        setActiveId(items[items.length - 1]?.id ?? '');
      } catch {
        if (aborted) return;
        const fallback = [{
          id: 'doc-1',
          number: 1,
          title: defaultTitle(1),
          content: buildDefaultMd(),
          createdAt: new Date().toISOString(),
        }];
        setLocal(fallback);
        setActiveId(fallback[0].id);
      }
    })();

    return () => { aborted = true; };
  }, [student?.id, sortedSessions.length]);

  const patchActive = (patch: Partial<NoteSession>) => {
    const current = local.find((s) => s.id === activeId);
    if (!current) return;
    const updated: NoteSession = { ...current, ...patch };
    setLocal((xs) => xs.map((s) => (s.id === current.id ? updated : s)));
    onUpdateSession?.(updated);
  };

  return (
    <div className="flex gap-6">
      {/* Sidebar wider */}
      <aside className="w-80 shrink-0">
        <div className="flex flex-col gap-3">
          {local.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={`flex flex-col items-start gap-2 text-left pt-4 h-40 px-4 w-full rounded-xl border transition ${
                activeId === s.id
                  ? 'bg-zinc-900 text-white border-zinc-600 ring-2 ring-zinc-500/40'
                  : 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700'
              }`}
              title={s.title}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 opacity-90" />
                <span className="truncate font-medium">
                  #{s.number} — {s.title}
                </span>
              </div>
              {/* Placeholder labels */}
              <div className="text-xs text-zinc-400 ml-7">
                Placeholder label 1
              </div>
              <div className="text-xs text-zinc-500 ml-7">
                Placeholder label 2
              </div>
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
