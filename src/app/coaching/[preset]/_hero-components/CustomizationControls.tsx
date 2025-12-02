"use client";

import {
  SessionConfig,
  clamp,
  addLiveBlock,
  removeLiveBlock,
  totalMinutes,
  MIN_MINUTES,
  MAX_MINUTES,
  LIVEBLOCK_MIN,
  MAX_BLOCKS,
} from "@/engine/session";

export function canDecDuration(c: SessionConfig) {
  return !(c.liveMin === MIN_MINUTES && c.liveBlocks === 0);
}
export function canIncDuration(c: SessionConfig) {
  return totalMinutes(c) < MAX_MINUTES;
}
export function canAddBlock(c: SessionConfig) {
  return c.liveBlocks < MAX_BLOCKS &&
    totalMinutes({ ...c, liveBlocks: c.liveBlocks + 1 }) <= MAX_MINUTES;
}
export function canRemoveBlock(c: SessionConfig) {
  return c.liveBlocks > 0;
}

function decDuration(c: SessionConfig): SessionConfig {
  return clamp({ ...c, liveMin: c.liveMin - 15 });
}
function incDuration(c: SessionConfig): SessionConfig {
  return clamp({ ...c, liveMin: c.liveMin + 15 });
}

export default function CustomizationControls({
  session,
  onChange,
  disabled,
}: {
  session: SessionConfig;
  onChange: (c: SessionConfig) => void;
  disabled?: boolean;
}) {
  const squareBtn =
    "w-12 h-12 grid place-items-center rounded-[10px] text-[15px] font-semibold text-white/95 " +
    "bg-white/[.08] supports-[backdrop-filter]:backdrop-blur-md " +
    "ring-1 ring-white/12 shadow-[inset_0_0_0_1px_rgba(0,0,0,.28)] " +
    "hover:bg-white/[.12] hover:ring-[rgba(120,160,255,.45)] " +
    "hover:shadow-[0_0_10px_rgba(56,124,255,.38),inset_0_0_0_1px_rgba(0,0,0,.28)] " +
    "active:scale-[.98] transition disabled:opacity-45 disabled:shadow-none disabled:cursor-not-allowed";

  return (
    <div className="space-y-3">

      {/* 1 — Duration */}
      <section>
        <div className="flex items-center justify-between">
          <span className="text-[15px] md:text-[16px] font-semibold">Add/remove time</span>
          <span className="text-sm opacity-80">{session.liveMin} min</span>
        </div>

        <div className="mt-2 flex gap-2">
          <button
            className={squareBtn}
            disabled={disabled || !canDecDuration(session)}
            onClick={() => onChange(decDuration(session))}
          >
            −15
          </button>

          <button
            className={squareBtn}
            disabled={disabled || !canIncDuration(session)}
            onClick={() => onChange(incDuration(session))}
          >
            +15
          </button>
        </div>
      </section>

      {/* 2 — Blocks */}
      <section>
        <div className="flex items-center justify-between">
          <span className="text-[15px] md:text-[16px] font-semibold">In-game coaching</span>
          <span className="text-sm opacity-80">{session.liveBlocks} × {LIVEBLOCK_MIN} min</span>
        </div>

        <div className="mt-2 flex gap-2">
          <button
            className={squareBtn}
            disabled={disabled || !canRemoveBlock(session)}
            onClick={() => onChange(removeLiveBlock(session))}
          >
            −45
          </button>

          <button
            className={squareBtn}
            disabled={disabled || !canAddBlock(session)}
            onClick={() => onChange(addLiveBlock(session))}
          >
            +45
          </button>
        </div>
      </section>

      {/* 3 — Followups */}
      <section>
        <div className="flex items-center justify-between">
          <span className="text-[15px] md:text-[16px] font-semibold">Follow-up recordings</span>
          <span className="text-sm opacity-80">{session.followups} × 15 min</span>
        </div>

        <div className="mt-2 flex gap-2">
          <button
            className={squareBtn}
            disabled={disabled || session.followups <= 0}
            onClick={() => onChange({ ...session, followups: session.followups - 1 })}
          >
            −
          </button>

          <button
            className={squareBtn}
            disabled={disabled || session.followups >= 2}
            onClick={() => onChange({ ...session, followups: session.followups + 1 })}
          >
            +
          </button>
        </div>
      </section>
    </div>
  );
}
