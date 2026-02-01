'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import type { Student, Session as PrismaSession } from '@prisma/client';
import DocTemplate from './_components/DocTemplate';
import { buildDefaultMd } from './_components/noteDefaults';
import ChampionManager from './_components/ChampionManager';

export type NoteSession = {
  id: string;            // sessionId (preferred) or fallback doc id
  number: number;        // doc number (display only)
  title: string;         // ALWAYS session.sessionType (when session exists)
  content: string;
  createdAt: string;
  champions?: string[];
  sessionId?: string;    // keep explicit linkage for safety/debugging
};

type Props = {
  student: Student;
  sessions: PrismaSession[];
  onCreateSession?: (s: NoteSession) => void;
  onUpdateSession?: (s: NoteSession) => void;
};

function sessionDate(s: PrismaSession) {
  const dt = (s as any).scheduledStart ?? s.createdAt;
  return dt instanceof Date ? dt : new Date(dt);
}

export default function SessionNotes({ student, sessions, onUpdateSession }: Props) {
  const sortedSessions = useMemo(
    () =>
      [...(sessions ?? [])].sort((a, b) => {
        const aTime = sessionDate(a).getTime();
        const bTime = sessionDate(b).getTime();
        return aTime - bTime;
      }),
    [sessions]
  );

  const sessionById = useMemo(() => {
    const m = new Map<string, PrismaSession>();
    for (const s of sortedSessions) m.set(String(s.id), s);
    return m;
  }, [sortedSessions]);

  const [local, setLocal] = useState<NoteSession[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const active = local.find((s) => s.id === activeId) ?? local[0];

  useEffect(() => {
    let aborted = false;
    if (!student?.id) return;

    console.log('[SessionNotes] effect start', {
      studentId: student.id,
      sessionsLen: sessions?.length ?? 0,
      sortedSessionsLen: sortedSessions.length,
      firstSortedSession: sortedSessions[0]
        ? { id: String(sortedSessions[0].id), sessionType: (sortedSessions[0] as any).sessionType }
        : null,
    });

    (async () => {
      try {
        const listRes = await fetch(
          `/api/session-docs?studentId=${encodeURIComponent(student.id)}`,
          { cache: 'no-store' }
        );
        const listJson = listRes.ok
          ? await listRes.json()
          : { docs: [] as Array<{ id: string; number: number }> };

        const docs: Array<{ id: string; number: number }> = listJson?.docs ?? [];

        console.log('[SessionNotes] docs list', {
          ok: listRes.ok,
          status: listRes.status,
          docsLen: docs.length,
          firstDoc: docs[0] ?? null,
        });

        // If there are NO docs yet, derive from sessions directly.
        if (!docs.length) {
          const mapped: NoteSession[] = sortedSessions.map((s, i) => {
            const n = i + 1;
            return {
              id: String(s.id), // real session id
              sessionId: String(s.id),
              number: n,
              title: String((s as any).sessionType ?? '').trim(), // ✅ sessionType only
              content: (s as any).notes ?? buildDefaultMd(),
              createdAt: sessionDate(s).toISOString(),
              champions: (s as any).champions ?? [],
            };
          });

          console.log('[SessionNotes] no docs -> mapped from sessions', {
            mappedLen: mapped.length,
            lastMapped: mapped[mapped.length - 1]
              ? { id: mapped[mapped.length - 1].id, title: mapped[mapped.length - 1].title }
              : null,
          });

          if (aborted) return;

          if (mapped.length === 0) {
            setLocal([]);
            setActiveId('');
            return;
          }

          setLocal(mapped);
          setActiveId(mapped[mapped.length - 1]?.id ?? '');
          return;
        }

        // Docs exist -> fetch details (includes sessionId)
        const details = await Promise.all(
          docs.map(async (d) => {
            try {
              const r = await fetch(
                `/api/session-docs/${encodeURIComponent(student.id)}?number=${d.number}`,
                { cache: 'no-store' }
              );
              if (!r.ok) return null;
              const j = await r.json();
              const doc = j?.doc as {
                id: string;
                number: number;
                notes: any;
                updatedAt?: string;
                sessionId?: string;
              };
              return doc;
            } catch {
              return null;
            }
          })
        );

        console.log('[SessionNotes] doc details', {
          detailsLen: details.filter(Boolean).length,
          firstDetail: details.find(Boolean) ?? null,
        });

        const items: NoteSession[] = details
          .filter(Boolean)
          .map((doc) => {
            const n = doc!.number;
            const raw = doc!.notes;

            // content only (title comes from sessionType)
            let content = '';
            if (raw && typeof raw === 'object' && ('md' in raw || 'title' in raw)) {
              content = (raw as any).md ?? '';
            } else if (typeof raw === 'string') {
              content = raw;
            } else {
              content = buildDefaultMd();
            }

            const sid = doc!.sessionId ? String(doc!.sessionId) : '';
            const session = sid ? sessionById.get(sid) : undefined;

            const title = session ? String((session as any).sessionType ?? '').trim() : '';

            // 🔎 single, high-signal log for the join:
            if (n === 1 || title === '') {
              console.log('[SessionNotes] join check', {
                docNumber: n,
                docSessionId: doc!.sessionId,
                sessionFound: !!session,
                sessionId: session ? String(session.id) : null,
                sessionTypeOnClient: session ? (session as any).sessionType : null,
                sessionByIdHasKey: sid ? sessionById.has(sid) : false,
              });
            }

            const id = doc!.sessionId ? sid : `doc-${n}`;

            return {
              id,
              sessionId: doc!.sessionId ? sid : undefined,
              number: n,
              title,
              content,
              createdAt: session ? sessionDate(session).toISOString() : new Date().toISOString(),
              champions: session ? ((session as any).champions ?? []) : [],
            };
          })
          .sort((a, b) => a.number - b.number);

        if (aborted) return;
        setLocal(items);
        setActiveId(items[items.length - 1]?.id ?? '');
      } catch {
        if (aborted) return;
        setLocal([]);
        setActiveId('');
      }
    })();

    return () => {
      aborted = true;
    };
  }, [student?.id, sortedSessions.length, sessionById]);

  const patchActive = (patch: Partial<NoteSession>) => {
    const current = local.find((s) => s.id === activeId);
    if (!current) return;

    const updated: NoteSession = { ...current, ...patch };
    setLocal((xs) => xs.map((s) => (s.id === current.id ? updated : s)));
    onUpdateSession?.(updated);
  };

  const handleChampionsUpdate = (champions: string[]) => {
    patchActive({ champions });
  };

return (
  <div className="flex flex-col md:flex-row gap-6">
    <aside className="w-full md:w-80 md:shrink-0">
      <div className="flex flex-col gap-3">
          {local.map((s) => {
            const isRealSession = !!s.sessionId && !s.id.startsWith('doc-');

            return (
              <div
                key={s.id}
                className={`flex flex-col items-start gap-2 text-left pt-4 h-40 px-4 w-full rounded-xl border transition cursor-pointer ${
                  activeId === s.id
                    ? 'bg-zinc-900 text-white border-zinc-600 ring-2 ring-zinc-500/40'
                    : 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700'
                }`}
                title={s.title}
                onClick={() => setActiveId(s.id)}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 opacity-90" />
                  <span className="truncate font-medium">
                    #{s.number}
                    {s.title ? ` — ${s.title}` : ''}
                  </span>
                </div>

                {isRealSession ? (
                  <div className="w-full" onClick={(e) => e.stopPropagation()}>
                    <ChampionManager
                      sessionId={s.sessionId!}
                      champions={s.champions ?? []}
                      onUpdate={handleChampionsUpdate}
                    />
                  </div>
                ) : (
                  <div className="text-xs text-zinc-500 ml-7">No session data available</div>
                )}
              </div>
            );
          })}
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
