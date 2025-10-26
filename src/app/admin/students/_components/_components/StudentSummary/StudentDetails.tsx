'use client';

import type { Student } from '@prisma/client';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Hash, MessageCircle, Server, Pencil, RefreshCcw } from 'lucide-react';

export type MinimalStudent = Pick<
  Student,
  'id' | 'name' | 'discordId' | 'discordName' | 'riotTag' | 'server' | 'puuid' | 'createdAt' | 'updatedAt'
>;

export type EditablePatch = Partial<Pick<Student, 'name' | 'discordId' | 'discordName' | 'riotTag' | 'server'>>;

type Props = {
  student: MinimalStudent;
  onChange?: (updated: EditablePatch) => void;
};

const SERVER_ALIAS: Record<string, string> = {
  euw: 'euw1', eu: 'euw1', euw1: 'euw1',
  eune: 'eun1', eun: 'eun1', eun1: 'eun1',
  na: 'na1', na1: 'na1',
  oce: 'oc1', oc1: 'oc1',
  lan: 'la1', la1: 'la1',
  las: 'la2', la2: 'la2',
  br: 'br1', br1: 'br1',
  tr: 'tr1', tr1: 'tr1',
  ru: 'ru', kr: 'kr',
  jp: 'jp1', jp1: 'jp1',
  ph: 'ph2', ph2: 'ph2',
  sg: 'sg2', sg2: 'sg2',
  th: 'th2', th2: 'th2',
  tw: 'tw2', tw2: 'tw2',
  vn: 'vn2', vn2: 'vn2',
};

export const normalizeServer = (s: string | null | undefined) => {
  const key = (s ?? '').trim().toLowerCase();
  return SERVER_ALIAS[key] || key || '';
};

export const parseRiot = (v: string) => {
  const [name, tag] = (v ?? '').split('#');
  return { name: name?.trim() || '', tag: tag?.trim() || '' };
};

export default function StudentDetails({ student, onChange }: Props) {
  const [name, setName] = useState(student.name || '');
  const [discordName, setDiscordName] = useState(student.discordName || '');
  const [riotTag, setRiotTag] = useState(student.riotTag || '');
  const [server, setServer] = useState(student.server || '');
  const [isEditingRiot, setIsEditingRiot] = useState(false);
  const [resolving, setResolving] = useState(false);

  // Keep local inputs in sync with incoming props (unless Riot is being edited)
  useEffect(() => {
    setName(student.name || '');
    setDiscordName(student.discordName || '');
    setServer(student.server || '');
    if (!isEditingRiot) setRiotTag(student.riotTag || '');
  }, [
    student.id,
    student.name,
    student.discordName,
    student.server,
    student.riotTag,
    isEditingRiot,
  ]);

  // Kick parent once per student to mimic a user edit on first load (for resolve/fetch)
  const kickedForIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!onChange) return;
    if (kickedForIdRef.current === student.id) return;
    kickedForIdRef.current = student.id;

    const rt = (student.riotTag || '').trim();
    const sv = normalizeServer(student.server);

    if (rt || sv) onChange({ riotTag: rt, server: sv });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id]);

  const emit = (patch: EditablePatch) => onChange?.(patch);

  const emitDebounced = useMemo(() => {
    let t: any;
    return (patch: EditablePatch) => {
      clearTimeout(t);
      t = setTimeout(() => emit(patch), 250);
    };
  }, [onChange]);

  const { name: riotNamePart, tag: riotTagPart } = parseRiot(riotTag);
  const dpmUrl =
    riotNamePart && riotTagPart
      ? `https://dpm.lol/${encodeURIComponent(riotNamePart)}-${encodeURIComponent(riotTagPart)}`
      : undefined;

  const handleResolveClick = async () => {
    setResolving(true);
    try {
      // Call backend to refresh Riot#Tag using PUUID (no server needed)
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: true }),
      });
      const json = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        console.error(json?.error || 'Refresh failed');
        return;
      }

      const next = json.student as MinimalStudent | undefined;
      if (json.changed && next?.riotTag) {
        setRiotTag(next.riotTag);
        onChange?.({ riotTag: next.riotTag });
      }
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="flex-1 p-0">
      <h1 className="text-4xl font-extrabold tracking-tight text-white">
        <input
          aria-label="Name"
          className="bg-transparent border-none p-0 m-0 outline-none focus:outline-none focus:ring-0"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => emit({ name })}
          placeholder="Name"
          size={Math.max((name || '').length, 1)}
        />
      </h1>

      <div
        className="
          mt-6
          grid
          grid-cols-[auto_max-content_1fr]
          auto-rows-min
          items-center
          gap-x-3 gap-y-4
          text-lg text-zinc-200
        "
      >
        {/* Discord Name */}
        <Meta
          icon={<MessageCircle className="h-5 w-5" />}
          label="Discord"
          value={discordName || ''}
          onChange={(v) => setDiscordName(v)}
          onBlur={() => emit({ discordName })}
        />

        {/* Riot#Tag */}
        <div className="contents">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-white/80 ring-1 ring-white/10">
            <Hash className="h-5 w-5" />
          </span>
          <span className="text-zinc-400 px-1">Riot#Tag:</span>
          <div className="flex items-center min-w-0">
            {isEditingRiot ? (
              <input
                aria-label="Riot#Tag"
                className="font-semibold text-zinc-100 bg-transparent border-none outline-none focus:outline-none focus:ring-0 px-1 min-w-0"
                value={riotTag || ''}
                onChange={(e) => setRiotTag(e.target.value)}
                onBlur={() => {
                  setIsEditingRiot(false);
                  emit({ riotTag: riotTag.trim() });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  if (e.key === 'Escape') {
                    setIsEditingRiot(false);
                    setRiotTag(student.riotTag || '');
                  }
                }}
                placeholder="—"
                autoFocus
              />
            ) : dpmUrl ? (
              <a
                href={dpmUrl}
                target="_blank"
                rel="noreferrer noopener"
                title={dpmUrl}
                className="font-semibold text-zinc-100 px-1 min-w-0 truncate no-underline focus:outline-none"
              >
                {riotTag || '—'}
              </a>
            ) : (
              <span className="font-semibold text-zinc-100 px-1 min-w-0 truncate">
                {riotTag || '—'}
              </span>
            )}

            {!isEditingRiot && (
              <>
                <button
                  type="button"
                  aria-label="Edit Riot Tag"
                  title="Edit Riot Tag"
                  onClick={() => setIsEditingRiot(true)}
                  className="ml-2 inline-flex items-center justify-center rounded-md p-1 text-white/70 hover:text-white hover:bg-white/10 transition"
                >
                  <Pencil className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  aria-label="Resolve Riot Tag"
                  title="Resolve Riot Tag"
                  onClick={handleResolveClick}
                  disabled={resolving}
                  className="ml-1 inline-flex items-center justify-center rounded-md p-1 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  <RefreshCcw className={`h-4 w-4 ${resolving ? 'animate-spin' : ''}`} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Server */}
        <Meta
          icon={<Server className="h-5 w-5" />}
          label="Server"
          value={server || ''}
          onChange={(v) => {
            setServer(v);
            emitDebounced({ server: normalizeServer(v) });
          }}
          onBlur={() => emit({ server: normalizeServer(server) })}
          transformDisplay={(v) => v.toUpperCase()}
        />
      </div>
    </div>
  );
}

function Meta({
  icon,
  label,
  value,
  onChange,
  onBlur,
  transformDisplay,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  transformDisplay?: (v: string) => string;
}) {
  const display = transformDisplay ? transformDisplay(value) : value;
  const shown = display ?? '';

  return (
    <div className="contents">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-white/80 ring-1 ring-white/10">
        {icon}
      </span>
      <span className="text-zinc-400 px-1">{label}:</span>
      <input
        aria-label={label}
        className="font-semibold text-zinc-100 bg-transparent border-none outline-none focus:outline-none focus:ring-0 px-1 w-full min-w-0"
        value={shown}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="—"
        style={transformDisplay ? { textTransform: 'uppercase' } : undefined}
      />
    </div>
  );
}
