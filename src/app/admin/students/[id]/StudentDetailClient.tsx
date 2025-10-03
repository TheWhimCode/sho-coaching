// src/app/admin/students/[id]/StudentDetailClient.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Student, Session } from '@prisma/client';

import StudentSummary from '../_components/StudentSummary';
import MatchHistory from '../_components/MatchHistory';
import SessionTemplate from '../_components/SessionNotes';
import GlassPanel from '@/app/_components/panels/GlassPanel';

type EditablePatch = Partial<Pick<Student, 'name' | 'discordId' | 'discordName' | 'riotTag' | 'server'>>;

const SERVER_ALIAS: Record<string, string> = {
  euw: 'euw1', eu: 'euw1', euw1: 'euw1',
  eune: 'eun1', eun: 'eun1', eun1: 'eun1',
  na: 'na1', na1: 'na1',
  oce: 'oc1', oc1: 'oc1',
  lan: 'la1', la1: 'la1',
  las: 'la2', la2: 'la2',
  br: 'br1', br1: 'br1',
  tr: 'tr1', tr1: 'tr1',
  ru: 'ru',
  kr: 'kr',
  jp: 'jp1', jp1: 'jp1',
  ph: 'ph2', ph2: 'ph2',
  sg: 'sg2', sg2: 'sg2',
  th: 'th2', th2: 'th2',
  tw: 'tw2', tw2: 'tw2',
  vn: 'vn2', vn2: 'vn2',
};
const normalizeServer = (s: string | null | undefined) => {
  const key = (s ?? '').trim().toLowerCase();
  return SERVER_ALIAS[key] || key || '';
};

const debounce = <F extends (...a: any[]) => any>(fn: F, ms = 600) => {
  let t: any;
  return (...a: Parameters<F>) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
};

export default function StudentDetailClient() {
  const params = useParams();
  const id = (params?.id as string) || '';

  const [student, setStudent] = useState<Student | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [riotTag, setRiotTag] = useState('');
  const [server, setServer] = useState('');
  const [puuid, setPuuid] = useState<string | null>(null);

  // solo payload from backend (recent matches)
  const [solo, setSolo] = useState<any | null>(null);
  const [soloLoading, setSoloLoading] = useState(false);
  const [soloErr, setSoloErr] = useState<string | null>(null);

  // initial student load
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    fetch(`/api/admin/students/${encodeURIComponent(id)}`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.text()) || `Student ${r.status}`);
        return r.json();
      })
      .then((j) => {
        const s = j.student as Student | null;
        if (!s) throw new Error('Not found');
        setStudent(s);
        setRiotTag(s.riotTag || '');
        setServer(normalizeServer(s.server));
        setPuuid(s.puuid ?? null);
      })
      .catch((err) => { setError(err.message); setStudent(null); })
      .finally(() => setLoading(false));
  }, [id]);

  // sessions (fetch from /api/admin/bookings as you want)
  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/bookings?studentId=${encodeURIComponent(id)}&take=10`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setSessions(j?.sessions ?? []))
      .catch(() => setSessions([]));
  }, [id]);

  // resolve (if needed) + fetch solo data (last 10 games for MatchHistory)
  useEffect(() => {
    const rt = riotTag.trim();
    const sv = server.trim();

    if (!sv || (!puuid && !rt)) {
      setSolo(null);
      setSoloErr(null);
      setSoloLoading(false);
      return;
    }

    const controller = new AbortController();
    (async () => {
      setSoloLoading(true);
      setSoloErr(null);

      let usePuuid = puuid;

      // resolve if needed (by tag+server)
      if (!usePuuid) {
        try {
          const res = await fetch(`/api/riot/resolve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ riotTag: rt, server: sv }),
            signal: controller.signal,
          });
          const j = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(j.error || j.detail || `Resolve ${res.status}`);
          usePuuid = j.puuid as string;
          setPuuid(usePuuid);

          // persist puuid on student
          fetch(`/api/admin/students/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ puuid: usePuuid, server: sv }),
          }).catch(() => {});
        } catch (e: any) {
          if (!controller.signal.aborted) {
            setSolo(null);
            setSoloErr(String(e?.message || e));
            setSoloLoading(false);
          }
          return;
        }
      }

      // NEW: get canonical riotTag by puuid (and persist if different)
      try {
        if (usePuuid) {
          const res2 = await fetch(`/api/riot/resolve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ puuid: usePuuid, server: sv }),
            signal: controller.signal,
          });
          const j2 = await res2.json().catch(() => ({}));

          const resolvedTag: string | undefined =
            j2.riotTag ??
            (j2.gameName && j2.tagLine ? `${j2.gameName}#${j2.tagLine}` : undefined);

          if (resolvedTag && resolvedTag !== rt) {
            setRiotTag(resolvedTag);
            fetch(`/api/admin/students/${encodeURIComponent(id)}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ riotTag: resolvedTag }),
            }).catch(() => {});
          }
        }
      } catch {
        // non-fatal
      }

      // fetch solo (matches only needed for MatchHistory)
      try {
        const q = new URLSearchParams({ server: sv, puuid: usePuuid!, count: '10' });
        const r = await fetch(`/api/riot/solo?${q.toString()}`, { signal: controller.signal });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || j.detail || `Solo ${r.status}`);
        setSolo(j);
      } catch (e: any) {
        if (!controller.signal.aborted) {
          setSolo({ matches: [], aggregates: [] });
          setSoloErr(String(e?.message || e));
        }
      } finally {
        if (!controller.signal.aborted) setSoloLoading(false);
      }
    })();

    return () => controller.abort();
  }, [id, riotTag, server, puuid]);

  // --- handle changes from StudentSummary ---
  const handleChange = (patch: EditablePatch) => {
    const normalizedPatch: EditablePatch = {
      ...patch,
      ...(patch.server !== undefined ? { server: normalizeServer(patch.server) } : {}),
    };

    setStudent((prev) => (prev ? ({ ...prev, ...normalizedPatch } as Student) : prev));

    if (normalizedPatch.riotTag !== undefined) {
      setRiotTag((normalizedPatch.riotTag || '').trim());
      setPuuid(null);    // re-resolve
      setSolo(null);
    }
    if (normalizedPatch.server !== undefined) {
      const ns = normalizeServer(normalizedPatch.server);
      setServer(ns);
      setPuuid(null);    // region may change; re-resolve
      setSolo(null);
    }

    fetch(`/api/admin/students/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizedPatch),
    }).catch(() => {});
  };

  // helpers
  const numberFor = (sid: string) => {
    const idx = sessions.findIndex((x) => String(x.id) === String(sid));
    return idx >= 0 ? idx + 1 : 1;
  };

  // server save for docs — FORCE title to sessionType
  const saveDoc = useMemo(
    () =>
      debounce(async (studentId: string, number: number, content: string, _ignoredTitle: string) => {
        const matching = sessions[number - 1]; // SessionNotes aligns #n to nth session
        const titleToSave =
          matching?.sessionType?.trim() ||
          (matching ? `Session ${number}` : `Session ${number}`);

        await fetch(`/api/session-docs/${encodeURIComponent(studentId)}?number=${number}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: { md: content, title: titleToSave } }),
        });
      }, 600),
    [sessions]
  );

  if (loading) return <div className="px-6 pt-8 pb-6 text-sm text-zinc-400">Loading…</div>;
  if (error)   return <div className="px-6 pt-8 pb-6 text-sm text-rose-400">{error}</div>;
  if (!student) return <div className="px-6 pt-8 pb-6 text-sm text-zinc-400">Student not found.</div>;

  const matches = solo?.matches ?? [];

  return (
    <main className="relative min-h-screen text-white overflow-x-clip">
      {/* BG LAYERS */}
      <div
        aria-hidden
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 22% 18%, rgba(0,130,255,0.28), transparent 58%),' +
            'radial-gradient(circle at 78% 32%, rgba(255,100,30,0.24), transparent 58%),' +
            'radial-gradient(circle at 25% 82%, rgba(0,130,255,0.20), transparent 58%),' +
            'radial-gradient(circle at 80% 75%, rgba(255,100,30,0.18), transparent 58%)',
        }}
      />
      <div
        aria-hidden
        className="fixed inset-0 z-0 opacity-25 mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: "url('/images/coaching/texture.png')", backgroundRepeat: 'repeat' }}
      />

      {/* content */}
      <div className="relative z-10 pb-20">
        <div className="mx-auto w-full max-w-6xl px-6 space-y-10">
          <div className="h-1" />

          <GlassPanel className="p-6 md:p-8">
            <StudentSummary
              student={{
                id: student.id,
                name: student.name,
                discordId: student.discordId ?? null,
                discordName: student.discordName ?? null,
                riotTag: student.riotTag,
                server,
                puuid: puuid ?? null,
                createdAt: student.createdAt,
                updatedAt: student.updatedAt,
              }}
              onChange={handleChange}
            />
            {soloLoading ? (
              <div className="mt-2 text-xs text-zinc-400">Loading SoloQ…</div>
            ) : null}
            {soloErr ? (
              <div className="mt-2 text-xs text-amber-400">Solo: {soloErr}</div>
            ) : null}
          </GlassPanel>

          <GlassPanel className="p-6 md:p-8">
            {/* Match history full width */}
            <MatchHistory matches={matches} puuid={puuid ?? undefined} />
          </GlassPanel>

          <GlassPanel className="p-6 md:p-8">
            <SessionTemplate
              student={student}
              sessions={sessions}
              onUpdateSession={(s) =>
                saveDoc(
                  student.id,
                  (s as any).number ?? numberFor(s.id),
                  s.content,
                  // ignored by saveDoc; title is forced to sessionType
                  s.title || `Session ${(s as any).number ?? ''}`
                )
              }
            />
          </GlassPanel>
        </div>
      </div>
    </main>
  );
}
