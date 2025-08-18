"use client";

import { motion } from "framer-motion";
import SessionBlock from "@/app/sessions/components/SessionBlock";

type Props = {
  title?: string;
  baseMinutes: number;
  extraMinutes?: number;
  totalPriceEUR: number;
  isCustomizing?: boolean;
  followups?: number;     // 0–2
  liveBlocks?: number;    // optional
};

export default function CenterSessionPanel({
  title = "VOD Review",
  baseMinutes,
  extraMinutes = 0,
  totalPriceEUR,
  isCustomizing = false,
  followups = 0,
  liveBlocks = 0,
}: Props) {
  const totalMinutes = baseMinutes + extraMinutes;

  return (
    <div className="relative w-full max-w-md">
      <div className="rounded-2xl backdrop-blur-md p-6 shadow-[0_10px_30px_rgba(0,0,0,.35)] bg-[#0B1220]/80 ring-1 ring-[rgba(146,180,255,.18)]">
<SessionBlock
  title={title}                 // optional; auto title will override if you omit this
  minutes={totalMinutes}
  priceEUR={totalPriceEUR}
  followups={followups}
  liveBlocks={liveBlocks}
  isActive={isCustomizing}
  background="transparent"
  className="p-0"
/>

        {/* Follow-up blocks (max 2) */}
{followups > 0 && (
  <div className="mt-3 space-y-2">
    {Array.from({ length: followups }).map((_, i) => (
      <div
        key={i}
        className="rounded-2xl p-4 backdrop-blur-md
                   bg-[rgba(9,14,25,0.85)]
                   shadow-[0_10px_30px_rgba(0,0,0,.35)]
                   flex items-center justify-between"
      >
        <div className="text-sm text-white/90 font-semibold">
          Follow-up recording {i + 1}
        </div>
        <div className="text-xs text-white/90 font-semibold">15 min</div>
      </div>
    ))}
  </div>
)}


        {!isCustomizing && (
          <div className="mt-5 text-sm text-white/80 space-y-3">
            <p>Get timestamped insights on your gameplay, a clear action plan, and follow-ups.</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[rgba(143,184,230,0.7)]" />
                <span>Send VOD + goals</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[rgba(143,184,230,0.7)]" />
                <span>Live review + notes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[rgba(143,184,230,0.7)]" />
                <span>Action plan & next steps</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
