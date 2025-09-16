// coaching/_coaching-components/Survey.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { SURVEY, type Preset, type SurveyAnswerMap } from "@/lib/survey/presets";
import { colorsByPreset } from "@/lib/sessions/colors";

const PRESET_DETAILS: Record<Preset, { title: string; desc: string; img: string }> = {
  signature: {
    title: "Signature Session",
    desc:
      "Deep, live coaching focused on decision-making, habits, and long-term growth. We prep beforehand, review your goals, and then dive into structured breakdowns with screen-shared examples, live drills, and clear action items.",
    img: "/images/sessions/Signature3.png",
  },
  vod: {
    title: "VOD Review",
    desc:
      "Asynchronous analysis of your gameplay with tight, timestamped feedback. I highlight decision trees, punish windows, and pattern leaks you can fix fast—no scheduling required.",
    img: "/images/sessions/VOD7.png",
  },
  instant: {
    title: "Instant Insight",
    desc:
      "Short, targeted session to unlock a specific bottleneck—perfect for a quick fix before a tilt spiral or to sanity-check a matchup, build, or early path.",
    img: "/images/sessions/Instant4.png",
  },
  custom: {
    title: "Custom Plan",
    desc:
      "A bespoke package tailored to your goals, schedule, and budget. Mix and match live sessions, VODs, drills, scrim reviews, and accountability check-ins.",
    img: "/images/sessions/Custom2.png",
  },
};

function computeRecommendation(answers: SurveyAnswerMap): { top: Preset; scores: Record<Preset, number> } {
  const totals: Record<Preset, number> = { vod: 0, signature: 0, instant: 0, custom: 0 };
  for (const q of SURVEY) {
    const a = answers[q.id];
    if (!a) continue;
    const opt = q.options.find((o) => o.value === a);
    if (opt) totals[opt.preset] += 1;
  }
  const order: Preset[] = ["signature", "vod", "instant", "custom"];
  const top = order.reduce((best, p) => (totals[p] > totals[best] ? p : best), order[0]);
  return { top, scores: totals };
}

// Simple fade variants only
const fadeVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

export default function Survey({ className = "" }: { className?: string }) {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<SurveyAnswerMap>({});
  const [direction, setDirection] = useState(1);
  const [justStarted, setJustStarted] = useState(false);

  const total = SURVEY.length;
  const isIntro = step < 0;
  const isDone = step >= total;
  const current = !isIntro && !isDone ? SURVEY[step] : undefined;
  const result = useMemo(() => (isDone ? computeRecommendation(answers) : null), [isDone, answers]);

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

  const modeKey = isIntro ? "intro" : isDone ? "result" : "questions";
  const ring = result ? colorsByPreset[result.top].ring : undefined;
  const glow = result ? colorsByPreset[result.top].glow : undefined;

  return (
    <section className={`relative w-full ${className}`}>
      <div className="mx-auto w-full max-w-3xl px-6 md:px-10">
        {/* Center the animated content within a viewport box */}
        <div className="relative h-[clamp(360px,42vh,520px)] flex items-center justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={modeKey}
              className="w-full"
              variants={fadeVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22 }}
            >
              {isIntro && (
                <div className="text-center py-10">
                  <h2 className="text-2xl md:text-3xl font-semibold leading-tight">
                    Still not sure what coaching session is best for you?
                  </h2>
                  <p className="mt-3 text-sm md:text-base text-white/70">
                    Take a quick 5-question survey and I’ll match you with the right format.
                  </p>
                  <button
                    onClick={() => {
                      setJustStarted(true);
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
                </div>
              )}

              {!isIntro && !isDone && (
                <div className="relative py-6">
                  {/* Controls row */}
                  <div className="mt-1 flex items-center gap-2">
                    {step > 0 && (
                      <button
                        onClick={goBack}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/80 hover:border-white/25 hover:text-white"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </button>
                    )}
                    <button
                      onClick={reset}
                      className="inline-flex items-center rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/80 hover:border-white/25 hover:text-white"
                    >
                      Reset
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={current!.id}
                      variants={fadeVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                      className="mt-4"
                    >
                      <h3 className="text-lg md:text-xl font-semibold leading-tight text-left">
                        {current!.question}
                      </h3>

                      {/* 1 per row on mobile, 2 per row from sm+, never 4 */}
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {current!.options.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => select(opt.value)}
                            className="min-h-[4rem] w-full rounded-lg border border-white/12 bg-white/[.05] px-3 py-2.5 text-left text-sm
                                       leading-snug hover:border-white/25 hover:bg-white/[.08] transition
                                       focus:outline-none focus:ring-2 focus:ring-white/25 flex items-center"
                          >
                            <span className="block w-full line-clamp-2">
                              {opt.label}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Progress bar at bottom */}
                      <div className="mt-5 h-[3px] w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          key={`progress-${step}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${((Math.min(step + 1, total)) / total) * 100}%` }}
                          transition={{ duration: 0.25 }}
                          className="h-full bg-white/60"
                        />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}

              {isDone && result && (
                <div className="relative">
                  <motion.div
                    key="result-card"
                    variants={fadeVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.22 }}
                    className="w-full"
                  >
                    <div
                      className="relative rounded-2xl p-[1px] shadow-[0_6px_24px_rgba(0,0,0,0.3)]"
                      style={{
                        background: `linear-gradient(135deg, ${ring} 0%, transparent 60%)`,
                        boxShadow: glow ? `0 6px 24px rgba(0,0,0,0.3), 0 0 28px ${glow}` : undefined,
                      }}
                    >
                      <div className="rounded-2xl bg-white/[.04] backdrop-blur-sm border border-white/10 overflow-hidden">
                        {/* Final session summary: left text, right full-height square image */}
                        <div className="grid grid-cols-[1fr_auto] items-stretch min-h-[12rem]">
                          {/* Left: summary */}
                          <div className="flex flex-col min-w-0 p-4 md:p-6">
                            <div className="inline-flex items-center gap-2">
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: ring }}
                              />
                              <h3 className="text-lg md:text-xl font-semibold tracking-tight">
                                {PRESET_DETAILS[result.top].title}
                              </h3>
                            </div>
                            <p className="mt-2 text-sm md:text-base leading-snug text-white/80 line-clamp-4">
                              {PRESET_DETAILS[result.top].desc}
                            </p>
                            <div className="mt-4">
                              <button
                                onClick={reset}
                                className="rounded-xl px-4 py-2 text-sm border border-white/20 hover:border-white/30"
                              >
                                Retake survey
                              </button>
                            </div>
                          </div>

                          {/* Right: full-height square image (covers entire card height) */}
                          <div className="relative h-full aspect-square shrink-0">
                            <img
                              src={PRESET_DETAILS[result.top].img}
                              alt={PRESET_DETAILS[result.top].title}
                              className="h-full w-full object-cover"
                              style={{ boxShadow: glow ? `0 6px 20px ${glow}` : undefined }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
