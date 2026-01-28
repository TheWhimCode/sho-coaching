"use client";

import { useEffect, useMemo, useState } from "react";

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Simple “Victory” overlay:
// - screen flash + radial glow
// - floating particles (confetti-ish)
// - little emote spam bubbles
// - auto-cleans itself; parent controls mount/unmount
export default function SuccessOverlay({
  durationMs = 1800,
  intensity = 1,
  text = "SUCCESS!",
}: {
  durationMs?: number;
  intensity?: number; // 0.5..2 feels good
  text?: string;
}) {
  const [phase, setPhase] = useState<"in" | "out">("in");

  // Generate particles once per mount
  const particles = useMemo(() => {
    const count = Math.round(clamp(36 * intensity, 18, 90));
    return Array.from({ length: count }).map((_, i) => {
      const size = rand(6, 14) * (0.9 + intensity * 0.15);
      const x = rand(10, 90);
      const y = rand(20, 85);
      const delay = rand(0, 180);
      const dur = rand(700, 1200) * (0.9 + intensity * 0.1);
      const driftX = rand(-18, 18);
      const driftY = rand(-22, -8);
      const rot = rand(-220, 220);
      const scaleTo = rand(0.9, 1.25);
      const blur = rand(0, 2.2);
      return {
        key: `p-${i}`,
        size,
        x,
        y,
        delay,
        dur,
        driftX,
        driftY,
        rot,
        scaleTo,
        blur,
      };
    });
  }, [intensity]);

  const emotes = useMemo(() => {
    // keep it emoji-safe (no custom images needed)
    const pool = ["✨", "🔥", "💥", "⭐", "🎉", "⚡", "🏆", "👑"];
    const count = Math.round(clamp(10 * intensity, 6, 18));
    return Array.from({ length: count }).map((_, i) => {
      const e = pool[Math.floor(rand(0, pool.length))];
      const x = rand(8, 92);
      const delay = rand(0, 240);
      const dur = rand(900, 1400) * (0.9 + intensity * 0.1);
      const rise = rand(18, 36);
      const size = rand(18, 34);
      return { key: `e-${i}`, e, x, delay, dur, rise, size };
    });
  }, [intensity]);

  useEffect(() => {
    // Begin fade-out slightly before unmount would normally happen
    const outAt = Math.max(0, durationMs - 350);
    const t = window.setTimeout(() => setPhase("out"), outAt);
    return () => window.clearTimeout(t);
  }, [durationMs]);

  return (
    <div
      aria-hidden
      className={[
        "fixed inset-0 z-50 pointer-events-none",
        "transition-opacity duration-300",
        phase === "out" ? "opacity-0" : "opacity-100",
      ].join(" ")}
    >
      {/* Screen flash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, rgba(120,220,255,0.24), transparent 58%), radial-gradient(circle at 48% 52%, rgba(255,230,150,0.18), transparent 62%), rgba(0,0,0,0.12)",
          animation: "so_flash 520ms ease-out both",
        }}
      />

      {/* Big glow ring */}
      <div
        className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 520,
          height: 520,
          borderRadius: 9999,
          boxShadow:
            "0 0 60px rgba(90,200,255,0.35), 0 0 120px rgba(255,220,120,0.22), inset 0 0 40px rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
          background:
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06), transparent 62%)",
          animation: "so_pop 650ms cubic-bezier(.2,.9,.2,1) both",
        }}
      />

      {/* Success text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="px-6 py-3 rounded-2xl"
          style={{
            background: "rgba(0,0,0,0.45)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.55), 0 0 50px rgba(80,180,255,0.14)",
            transform: "translateY(-8px)",
            animation: "so_text 900ms cubic-bezier(.2,.9,.2,1) both",
          }}
        >
          <div
            className="text-3xl md:text-4xl font-extrabold tracking-wide text-white"
            style={{
              textShadow:
                "0 0 12px rgba(0,0,0,0.95), 0 0 30px rgba(0,0,0,0.85)",
            }}
          >
            {text}
          </div>
        </div>
      </div>

      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.key}
            className="absolute rounded-sm"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size * 0.42,
              opacity: 0,
              filter: `blur(${p.blur}px)`,
              background:
                "linear-gradient(90deg, rgba(120,220,255,1), rgba(255,230,150,1))",
              transform: "translate3d(0,0,0) rotate(0deg) scale(0.9)",
              animation: `so_particle ${p.dur}ms ease-out ${p.delay}ms both`,
              // custom per-particle variables used by keyframes
              // @ts-expect-error CSS vars
              "--dx": `${p.driftX}vw`,
              "--dy": `${p.driftY}vh`,
              "--rot": `${p.rot}deg`,
              "--s": `${p.scaleTo}`,
            }}
          />
        ))}
      </div>

      {/* Emote spam */}
      <div className="absolute inset-0 overflow-hidden">
        {emotes.map((e) => (
          <div
            key={e.key}
            className="absolute select-none"
            style={{
              left: `${e.x}%`,
              bottom: "-8%",
              fontSize: e.size,
              opacity: 0,
              transform: "translate3d(0,0,0)",
              filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.55))",
              animation: `so_emote ${e.dur}ms ease-out ${e.delay}ms both`,
              // @ts-expect-error CSS vars
              "--rise": `${e.rise}vh`,
            }}
          >
            {e.e}
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes so_flash {
          0% {
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          100% {
            opacity: 0.55;
          }
        }

        @keyframes so_pop {
          0% {
            transform: translate(-50%, -50%) scale(0.65);
            opacity: 0;
          }
          25% {
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }

        @keyframes so_text {
          0% {
            transform: translateY(10px) scale(0.92);
            opacity: 0;
          }
          35% {
            opacity: 1;
          }
          100% {
            transform: translateY(-8px) scale(1);
            opacity: 1;
          }
        }

        @keyframes so_particle {
          0% {
            opacity: 0;
            transform: translate3d(0, 0, 0) rotate(0deg) scale(0.9);
          }
          10% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate3d(var(--dx), var(--dy), 0) rotate(var(--rot))
              scale(var(--s));
          }
        }

        @keyframes so_emote {
          0% {
            opacity: 0;
            transform: translate3d(0, 0, 0) scale(0.9);
          }
          12% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate3d(0, calc(-1 * var(--rise)), 0) scale(1.15);
          }
        }
      `}</style>
    </div>
  );
}
