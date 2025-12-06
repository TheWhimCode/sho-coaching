"use client";

import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import { SessionData } from "./SessionData";
import { colorsByPreset } from "@/engine/session";

// -----------------------------------------------------
// Helpers
// -----------------------------------------------------
function formatSmartDate(iso: string) {
  const d = new Date(iso);
  const month = d.toLocaleDateString([], { month: "short" });
  const day = d.getDate();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${month} ${day} • ${time}`;
}

function presetFromSessionType(
  t: string
): keyof typeof colorsByPreset | "custom" {
  const x = t.toLowerCase();
  if (x.includes("instant")) return "instant";
  if (x.includes("signature")) return "signature";
  if (x.includes("vod")) return "vod";
  if (x.includes("custom")) return "custom";
  return "custom";
}

function Dot({ type }: { type: string }) {
  const key = presetFromSessionType(type);
  const preset = colorsByPreset[key] ?? { ring: "#888" };

  return (
    <span
      className="inline-block rounded-full"
      style={{ width: 10, height: 10, background: preset.ring }}
    />
  );
}

// -----------------------------------------------------
// Component
// -----------------------------------------------------
type Props = {
  r: SessionData;
  onReschedule?: (id: string, newStartISO: string) => Promise<void>;
};

export default function SessionRowItem({ r, onReschedule }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [tempWhen, setTempWhen] = useState(
    new Date(r.scheduledStart).toISOString().slice(0, 16)
  );

  const [cursorPopup, setCursorPopup] = useState<{ x: number; y: number } | null>(null);

  const duration = r.liveMinutes ? `${r.liveMinutes} min` : "—";
  const blocks = r.liveBlocks ? String(r.liveBlocks) : "—";
  const followups = r.followups ? String(r.followups) : "—";

  const riotClean = r.student?.riotTag?.replace("#", "-") ?? "";

  function copyDiscord(e: React.MouseEvent) {
    if (!r.student?.discordName) return;
    navigator.clipboard.writeText(r.student.discordName);
    setCursorPopup({ x: e.clientX, y: e.clientY });
    setTimeout(() => setCursorPopup(null), 700);
  }

  async function handleReschedule() {
    if (!onReschedule) return;
    await onReschedule(r.id, new Date(tempWhen).toISOString());
    setEditing(false);
  }

  return (
    <li className="relative">

      {cursorPopup && (
        <div
          className="fixed pointer-events-none z-[9999] text-sm text-white bg-black/70 px-2 py-1 rounded opacity-100 animate-fadeOut"
          style={{
            left: cursorPopup.x + 10,
            top: cursorPopup.y + 10,
          }}
        >
          Copied!
        </div>
      )}

      {/* CLICKABLE HEADER (now full height) */}
      <div
        className="flex items-center justify-between gap-4 cursor-pointer px-4 py-4"
        onClick={() => setExpanded((x) => !x)}
      >
        <div className="flex items-center gap-3 min-w-[110px]">
          <Dot type={r.sessionType} />
          <span className="text-white/90 font-semibold tabular-nums">
            {duration}
          </span>
        </div>

        <div className="text-white/90 text-sm text-right min-w-[160px]">
          {formatSmartDate(r.scheduledStart)}
        </div>
      </div>

      {/* EXPANDED SECTION */}
      <div
        className={`
          overflow-hidden transition-all duration-300 ease-out
          ${expanded ? "max-h-[800px] opacity-100 mt-4" : "max-h-0 opacity-0 mt-0"}
          px-4
        `}
      >
        <div className="p-5 rounded-xl border border-white/20">

          {/* Headers */}
          <div className="grid grid-cols-[1fr_2fr_3fr] gap-6 text-white/80 text-sm mb-3">
            <div className="font-semibold uppercase tracking-wide">Details</div>
            <div className="font-semibold uppercase tracking-wide">Student</div>
            <div className="font-semibold uppercase tracking-wide">Notes</div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-[1fr_2fr_3fr] gap-6 text-[15px] leading-6">

            {/* COLUMN 1 */}
            <div className="grid grid-cols-[90px_1fr] gap-y-2">
              <div className="text-white/60">Duration</div>
              <div className={duration === "—" ? "text-white/60" : "font-semibold text-white"}>
                {duration}
              </div>

              <div className="text-white/60">Blocks</div>
              <div className={blocks === "—" ? "text-white/60" : "font-semibold text-white"}>
                {blocks}
              </div>

              <div className="text-white/60">Follow-ups</div>
              <div className={followups === "—" ? "text-white/60" : "font-semibold text-white"}>
                {followups}
              </div>
            </div>

            {/* COLUMN 2 */}
            <div className="grid grid-cols-[90px_1fr] gap-y-2">

              <div className="text-white/60">Name</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
window.open(`/admin/students/${r.studentId}`, "_blank", "noopener,noreferrer");
                  
                }}
                className="font-semibold text-left text-white hover:text-blue-400 hover:underline transition"
              >
                {r.student?.name ?? "—"}
              </button>

              <div className="text-white/60">Discord</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyDiscord(e);
                }}
                className={`text-left ${
                  r.student?.discordName
                    ? "font-semibold text-white hover:text-blue-300"
                    : "text-white/60"
                }`}
              >
                {r.student?.discordName ?? "—"}
              </button>

              <div className="text-white/60">Riot Tag</div>
              <a
                onClick={(e) => e.stopPropagation()}
                href={riotClean ? `https://dpm.lol/${riotClean}` : undefined}
                target="_blank"
                className={`text-left ${
                  r.student?.riotTag
                    ? "font-semibold text-white hover:text-purple-300 hover:underline"
                    : "text-white/60"
                }`}
              >
                {r.student?.riotTag ?? "—"}
              </a>
            </div>

            {/* COLUMN 3 */}
            <div className="whitespace-pre-wrap break-words leading-6 text-white/60">
              {r.notes && r.notes.trim() ? r.notes : "—"}
            </div>
          </div>

          {/* RESCHEDULE */}
          {onReschedule && (
            <div className="mt-6 flex items-center gap-3">
              {editing ? (
                <>
                  <input
                    type="datetime-local"
                    value={tempWhen}
                    onChange={(e) => setTempWhen(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-black/30 ring-1 ring-white/20 rounded px-2 py-1 text-sm"
                  />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReschedule();
                    }}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Save
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(false);
                    }}
                    className="text-white/60 hover:text-white"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(true);
                    }}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reschedule
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-2 text-white/80"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeOut {
          0% { opacity: 1; transform: translateY(0px); }
          100% { opacity: 0; transform: translateY(-6px); }
        }
        .animate-fadeOut {
          animation: fadeOut 0.7s forwards;
        }
      `}</style>
    </li>
  );
}
