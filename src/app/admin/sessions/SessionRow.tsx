// src/app/admin/bookings/SessionRow.tsx (or wherever it lives)
"use client";

import React from "react";
import { colorsByPreset } from "@/lib/sessions/colors";
import { Pencil } from "lucide-react";

export type SessionRow = {
  id: string;
  liveMinutes: number;
  discordName: string | null;
  sessionType: string;
  followups: number;
  liveBlocks: number | null;
  notes: string | null;
  scheduledStart: string; // ISO
};

// layout: dot | time | length | live blocks | follow-ups | discordName | notes
const GRID =
  "grid grid-cols-[20px_190px_96px_120px_130px_minmax(0,1fr)_minmax(0,1.2fr)] gap-x-4 items-center";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function presetFromSessionType(t: string): keyof typeof colorsByPreset | "custom" {
  const x = t.toLowerCase();
  if (x.includes("instant")) return "instant";
  if (x.includes("signature")) return "signature";
  if (x.includes("vod")) return "vod";
  if (x.includes("custom")) return "custom";
  return "custom";
}
function Dot({ sessionType }: { sessionType: string }) {
  const key = presetFromSessionType(sessionType);
  const preset = colorsByPreset[key] ?? { ring: "#a3a3a3" };
  return (
    <span
      aria-label={sessionType}
      title={sessionType}
      className="inline-block rounded-full"
      style={{ width: 10, height: 10, background: preset.ring }}
    />
  );
}
const Chip = ({ className = "", children }: { className?: string; children: React.ReactNode }) => (
  <span className={`px-2 py-0.5 rounded-md text-[11px] ring-1 ring-white/10 text-white/90 ${className}`}>
    {children}
  </span>
);

type Props = {
  r: SessionRow;
  /** Optional edit hook; when provided, a small pencil button appears next to the time */
  onEdit?: () => void;
  editIcon?: React.ReactNode;
  editAriaLabel?: string;
  editTitle?: string;
};

export default function SessionRowItem({
  r,
  onEdit,
  editIcon,
  editAriaLabel = "Reschedule",
  editTitle = "Reschedule",
}: Props) {
  const blocks = r.liveBlocks ?? 0;

  return (
    <li className="px-4 py-3">
      <div className={GRID}>
        {/* dot */}
        <Dot sessionType={r.sessionType} />

        {/* time (read-only, with optional edit button) */}
        <div className="flex items-center gap-2 text-white/90 tabular-nums min-w-0">
          <span className="truncate">{formatTime(r.scheduledStart)}</span>
          {onEdit && (
            <button
              aria-label={editAriaLabel}
              title={editTitle}
              className="p-1 rounded hover:bg-white/10"
              onClick={onEdit}
            >
              {editIcon ?? <Pencil className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* length */}
        <div>
          <Chip>{r.liveMinutes} min</Chip>
        </div>

        {/* live blocks */}
        <div>
          <Chip>Live Blocks: {blocks}</Chip>
        </div>

        {/* follow-ups */}
        <div>
          <Chip>Follow-ups: {r.followups}</Chip>
        </div>

        {/* discordName */}
        <div className="truncate text-white/90">
          {r.discordName ?? <span className="text-white/40">—</span>}
        </div>

        {/* notes */}
        <div className="text-white/70 text-sm break-words">
          {r.notes ? r.notes : <span className="text-white/35">—</span>}
        </div>
      </div>
    </li>
  );
}
