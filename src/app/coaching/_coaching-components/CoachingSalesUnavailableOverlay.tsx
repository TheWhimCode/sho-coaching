import Link from "next/link";
import { COACHING_DISCORD_URL } from "@/lib/coaching/coachingSales";

export default function CoachingSalesUnavailableOverlay() {
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center px-6 py-10"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto max-w-lg rounded-2xl border border-white/15 bg-[#0B0F1A]/88 px-6 py-7 text-center shadow-[0_24px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/10 backdrop-blur-md sm:px-8 sm:py-8">
        <p className="text-lg font-semibold leading-snug text-white sm:text-xl">
          Coaching temporarily unavailable, I don&apos;t have the time/energy right now!
        </p>
        <p className="mt-3 text-sm leading-relaxed text-white/62 sm:text-base">
          If you REALLY wanna do a session, reach out on{" "}
          <Link
            href={COACHING_DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#8FB8E6] underline decoration-[#8FB8E6]/45 underline-offset-2 transition hover:text-[#B8D8EA]"
          >
            Discord
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
