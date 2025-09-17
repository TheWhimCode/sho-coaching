// coaching/_coaching-components/Survey.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AnimatePresence,
  motion,
  type Variants,
  easeInOut,
  easeOut,
  easeIn,
} from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { SURVEY, type Preset, type SurveyAnswerMap } from "@/lib/survey/presets";
import SessionSummaryCard from "./components/SessionSummaryCard";

function computeRecommendation(answers: SurveyAnswerMap): {
  top: Preset;
  scores: Record<Preset, number>;
} {
  const totals: Record<Preset, number> = {
    vod: 0,
    signature: 0,
    instant: 0,
    custom: 0,
  };
  for (const q of SURVEY) {
    const a = answers[q.id];
    if (!a) continue;
    const opt = q.options.find((o) => o.value === a);
    if (opt) totals[opt.preset] += 1;
  }
  const order: Preset[] = ["signature", "vod", "instant", "custom"];
  const top = order.reduce(
    (best, p) => (totals[p] > totals[best] ? p : best),
    order[0]
  );
  return { top, scores: totals };
}

/** Animations */
const introVariants: Variants = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.25, ease: easeOut } },
};
const eraseRevealVariants: Variants = {
  initial: { opacity: 1, clipPath: "inset(0% 100% 0% 0%)" },
  animate: {
    opacity: 1,
    clipPath: "inset(0% 0% 0% 0%)",
    transition: { duration: 0.45, ease: easeInOut },
  },
  exit: { opacity: 0, transition: { duration: 0.2, ease: easeIn } },
};
const fadeQVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.22, ease: easeOut } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: easeIn } },
};
const resultVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25, ease: easeOut } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: easeIn } },
};

export default function Survey({ className = "" }: { className?: string }) {
  const [step, setStep] = useState(-1); // -1 intro
  const [answers, setAnswers] = useState<SurveyAnswerMap>({});
  const [direction, setDirection] = useState(1);
  const [justStarted, setJustStarted] = useState(false);

  const total = SURVEY.length;
  const isIntro = step < 0;
  const isDone = step >= total;
  const current = !isIntro && !isDone ? SURVEY[step] : undefined;
  const result = useMemo(
    () => (isDone ? computeRecommendation(answers) : null),
    [isDone, answers]
  );

  useEffect(() => {
    if (step > 0 && justStarted) setJustStarted(false);
  }, [step, justStarted]);

  function select(value: string) {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: value }));
    setDirection(1);
    setStep((s) => s + 1);
  }
  function goBack() {
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  }
  function reset() {
    setAnswers({});
    setDirection(1);
    setStep(-1);
    setJustStarted(false);
  }

  return (
    <section className={`relative w-full ${className}`}>
      <div className="mx-auto w-full max-w-[42rem] lg:max-w-[50rem] px-6 md:px-10">
        <div className="relative h-[clamp(420px,48vh,600px)] flex items-center justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            {isDone && result ? (
              <motion.div
                key="result"
                variants={resultVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full"
              >
                <h2 className="text-xl md:text-2xl font-semibold mb-4 text-center">
                  Your best match
                </h2>
                <SessionSummaryCard preset={result.top} onRetake={reset} />
              </motion.div>
            ) : isIntro ? (
              <motion.div
                key="intro"
                variants={introVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full text-center py-10"
              >
                <h2 className="text-2xl md:text-3xl font-semibold leading-tight">
                  Still not sure what session is best for you?
                </h2>
                <p className="mt-3 text-sm md:text-base text-white/70">
                  Take a quick 5-question survey and I’ll match you with the
                  right format.
                </p>
                <div className="relative inline-block mt-8">
                  <span className="pointer-events-none absolute -inset-1 rounded-xl blur-md opacity-30 -z-10 
                                     bg-[radial-gradient(60%_100%_at_50%_50%,_rgba(255,179,71,.28),_transparent_70%)]" />
                  <button
                    onClick={() => {
                      setJustStarted(true);
                      setDirection(1);
                      setStep(0);
                    }}
                    className="relative z-10 rounded-xl px-6 md:px-7 py-3 md:py-3.5 text-base font-semibold text-[#0A0A0A] 
                               bg-[#fc8803] hover:bg-[#f8a81a] transition shadow-[0_10px_28px_rgba(245,158,11,.35)] 
                               ring-1 ring-[rgba(255,190,80,.55)]"
                  >
                    Let’s go
                  </button>
                </div>
              </motion.div>
            ) : (
              <div key="questions" className="w-full">
                <div className="relative py-6">
                  {/* Controls */}
                  <div className="mt-1 flex items-center gap-2">
                    {step >= 0 && (
                      <button
                        onClick={goBack}
                        disabled={step === 0}
                        className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm 
                          ${step === 0
                            ? "border-white/10 text-white/40 cursor-not-allowed"
                            : "border-white/15 text-white/80 hover:border-white/25 hover:text-white"}`}
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </button>
                    )}
                  </div>

                  {/* Question */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={current!.id}
                      variants={step === 0 ? eraseRevealVariants : fadeQVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="mt-6"
                    >
                      <h3 className="text-xl md:text-2xl font-semibold leading-snug">
                        {current!.question}
                      </h3>

                      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {current!.options.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => select(opt.value)}
                            className="h-[3.5rem] md:h-[4rem] w-full rounded-xl border border-white/12 bg-white/[.05] px-4 text-left text-sm md:text-base
                                       leading-snug hover:border-sky-400/40 hover:bg-white/[.08] transition
                                       focus:outline-none focus:ring-2 focus:ring-sky-400/30 flex items-center
                                       shadow-[0_0_20px_-6px_rgba(255,255,255,0.12)]"
                          >
                            <span className="block w-full">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Progress bar */}
                  <div className="mt-8 h-[3px] w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={false}
                      animate={{
                        width: `${(Math.min(step + 1, total) / total) * 100}%`,
                      }}
                      transition={{ duration: 0.25, ease: easeOut }}
                      className="h-full bg-gradient-to-r from-sky-400 to-blue-500 shadow-[0_0_12px_rgba(56,189,248,0.7)]"
                    />
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
