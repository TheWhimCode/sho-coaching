// coaching/_coaching-components/Survey.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { SURVEY, type Preset, type SurveyAnswerMap } from "@/lib/survey/presets";

const PRESET_COLORS = {
  instant:   { ring: "#f6e9b3" },
  signature: { ring: "#f6b1b1" },
  vod:       { ring: "#a6c8ff" },
  custom:    { ring: "#d9d9d9" },
} as const;

function computeRecommendation(answers: SurveyAnswerMap): { top: Preset; scores: Record<Preset, number> } {
  const totals: Record<Preset, number> = { vod: 0, signature: 0, instant: 0, custom: 0 };
  for (const q of SURVEY) {
    const a = answers[q.id];
    if (!a) continue;
    const opt = q.options.find(o => o.value === a);
    if (opt) totals[opt.preset] += 1;
  }
  const order: Preset[] = ["signature", "vod", "instant", "custom"];
  const top = order.reduce((best, p) => (totals[p] > totals[best] ? p : best), order[0]);
  return { top, scores: totals };
}

// Animation variants with direction support
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
};

export default function Survey({ className = "" }: { className?: string }) {
  const [step, setStep] = useState(-1); // Step -1 = intro
  const [answers, setAnswers] = useState<SurveyAnswerMap>({});
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  const total = SURVEY.length;
  const isIntro = step < 0;
  const isDone = step >= total;
  const current = SURVEY[Math.max(step, 0)];
  const result = useMemo(() => (isDone ? computeRecommendation(answers) : null), [isDone, answers]);

  function select(value: string) {
    setAnswers(prev => ({ ...prev, [current.id]: value }));
    setDirection(1);
    setStep(s => s + 1);
  }
  function goBack() {
    setDirection(-1);
    setStep(s => Math.max(-1, s - 1));
  }
  function reset() {
    setAnswers({});
    setDirection(1);
    setStep(-1);
  }

  return (
    <section className={`relative w-full ${className}`}>
      {/* BACKGROUND */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1200px 600px at 12% 10%, rgba(80,110,255,0.18), transparent 60%)," +
            "radial-gradient(800px 400px at 85% 30%, rgba(249,205,93,0.10), transparent 60%)," +
            "radial-gradient(1100px 700px at 50% 120%, rgba(180,120,255,0.10), transparent 60%)",
        }}
      />
      <div className="absolute inset-0 -z-10 bg-[#0B0F1A]" />
      <div className="absolute inset-0 -z-10 bg-[url('/stars-noise.png')] opacity-[0.12] mix-blend-screen" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-0 right-0 top-0 h-px bg-white/10" />
        <div className="absolute left-0 right-0 bottom-0 h-px bg-white/10" />
      </div>

      {/* CONTENT */}
      <div className="mx-auto w-full max-w-2xl px-6 md:px-10 py-16 md:py-24">
        <AnimatePresence mode="wait" custom={direction}>
          {isIntro ? (
            <motion.div
              key="intro"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              custom={direction}
              transition={{ duration: 0.22 }}
              className="text-center h-[clamp(360px,42vh,520px)] flex flex-col items-center justify-center"
            >
              <h2 className="text-2xl md:text-3xl font-semibold leading-tight">
                Still not sure what coaching session is best for you?
              </h2>
              <p className="mt-3 text-sm md:text-base text-white/70">
                Take a quick 5-question survey and I’ll match you with the right format.
              </p>
              <button
                onClick={() => {
                  setDirection(1);
                  setStep(0);
                }}
                className="mt-8 inline-flex items-center justify-center rounded-2xl font-medium text-black
                           w-full sm:w-auto px-6 md:px-7 py-3 md:py-3.5 shadow-[0_6px_20px_rgba(0,0,0,0.2)]
                           hover:brightness-95 active:brightness-90 transition"
                style={{ backgroundColor: "#f6e9b3" }}
              >
                Let’s go
              </button>
            </motion.div>
          ) : !isDone ? (
            <div className="mx-auto h-[clamp(360px,42vh,520px)] flex flex-col">
              {/* Progress eyebrow + bar (static) */}
              <div className="mb-3">
                <div className="text-xs uppercase tracking-wide text-white/60">
                  Step {step + 1} of {total}
                </div>
                <div className="mt-2 h-[3px] w-full max-w-lg bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    key={`progress-${step}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${((step + 1) / total) * 100}%` }}
                    transition={{ duration: 0.25 }}
                    className="h-full bg-white/60"
                  />
                </div>
              </div>

              {/* Card container (static) */}
              <div className="rounded-2xl border border-white/10 bg-white/[.04] backdrop-blur-sm p-5 md:p-6 w-full max-w-xl">
                {/* Back button inside wrapper, top-left */}
                <button
                  onClick={goBack}
                  className="mb-4 flex items-center gap-1 text-sm text-white/70 hover:text-white/90"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>

                {/* Animate only question + buttons */}
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={current.id}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    custom={direction}
                    transition={{ duration: 0.22 }}
                  >
                    <h3 className="text-lg md:text-xl font-semibold leading-tight text-left">
                      {current.question}
                    </h3>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {current.options.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => select(opt.value)}
                          className="rounded-lg border border-white/12 bg-white/[.05] px-3 py-2.5 text-left text-sm leading-snug
                                     hover:border-white/25 hover:bg-white/[.08] transition
                                     focus:outline-none focus:ring-2 focus:ring-white/25"
                        >
                          <span className="block min-h-[1.75rem] flex items-center">
                            {opt.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <motion.div
              key="result"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              custom={direction}
              transition={{ duration: 0.22 }}
              className="mx-auto text-center h-[clamp(360px,42vh,520px)] flex flex-col justify-center"
            >
              <h3 className="text-lg md:text-xl font-semibold">Your recommended preset</h3>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                {(Object.keys(result!.scores) as Preset[]).map((k) => (
                  <div
                    key={k}
                    className="rounded-lg border border-white/10 bg-white/[.06] px-3 py-2 flex items-center justify-between"
                  >
                    <span className="capitalize">{k}</span>
                    <span className="font-semibold">{result!.scores[k]}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {result!.top !== "custom" && (
                  <Link
                    href={`/coaching/${result!.top}`}
                    className="rounded-xl px-5 py-2.5 text-sm font-medium text-black"
                    style={{ backgroundColor: PRESET_COLORS[result!.top].ring }}
                  >
                    Continue with{" "}
                    {result!.top === "vod"
                      ? "VOD Review"
                      : result!.top === "signature"
                      ? "Signature Session"
                      : "Instant Insight"}
                  </Link>
                )}
                <button
                  onClick={reset}
                  className="rounded-xl px-5 py-2.5 text-sm border border-white/15 hover:border-white/25"
                >
                  Retake survey
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
