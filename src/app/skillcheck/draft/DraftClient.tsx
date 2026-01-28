// app/skillcheck/draft/DraftClient.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Hero from "@/app/skillcheck/layout/Hero";
import { DraftOverlay } from "@/app/skillcheck/draft/game/DraftOverlay";
import ChampOptions from "@/app/skillcheck/draft/game/ChampOptions";
import { ResultScreen } from "@/app/skillcheck/draft/game/ResultScreen";
import DraftAuthorMain from "@/app/skillcheck/draft/authoring/DraftAuthorMain";
import SuccessOverlay from "@/app/skillcheck/games/SuccessOverlay";

type Pick = {
  role: "top" | "jng" | "mid" | "adc" | "sup";
  champ: string | null;
};

type DraftAnswer = {
  champ: string;
  explanation: string;
  correct?: true;
};

type DraftType = {
  id: string;
  blue: Pick[];
  red: Pick[];
  role: Pick["role"];
  userTeam: "blue" | "red";
  answers: DraftAnswer[];
};

export default function DraftClient({
  draft,
  avgAttempts,
}: {
  draft: DraftType;
  avgAttempts: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const [disabledAnswers, setDisabledAnswers] = useState<string[]>([]);
  const [lastWrong, setLastWrong] = useState<string | null>(null);

  const [blue, setBlue] = useState<Pick[]>(draft.blue);
  const [red, setRed] = useState<Pick[]>(draft.red);

  const [showSuccess, setShowSuccess] = useState(false);

  // AUTHORING MODE
  const [authoring, setAuthoring] = useState(false);
  const [authoringStep, setAuthoringStep] =
    useState<"setup" | "success">("setup");

  // Persistent scroll anchor in the DOM.
  const resultRef = useRef<HTMLDivElement | null>(null);
  const hasScrolledRef = useRef(false);

  // Time before showing ResultScreen + initiating scroll (same moment)
  const SHOW_AND_SCROLL_DELAY_MS = 2500;

  const SCROLL_BEHAVIOR: ScrollBehavior = "smooth";

  /* -----------------------------
     derived data
  ----------------------------- */

  const correctAnswer = useMemo(
    () => draft.answers.find((a) => a.correct)?.champ ?? "",
    [draft.answers]
  );

  const answerChamps = useMemo(
    () => draft.answers.map((a) => a.champ),
    [draft.answers]
  );

  /* -----------------------------
     load localStorage state
  ----------------------------- */

  useEffect(() => {
    const key = `skillcheck:${draft.id}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;

    try {
      const s = JSON.parse(raw);

      setAttempts(s.attempts ?? 0);
      setDisabledAnswers(s.disabledAnswers ?? []);
      setCompleted(!!s.completed);

      if (s.completed && s.placedChamp) {
        const isBlue = draft.userTeam === "blue";
        const team = isBlue ? draft.blue : draft.red;
        const setTeam = isBlue ? setBlue : setRed;

        const slotIndex = team.findIndex((p) => p.role === draft.role);
        if (slotIndex !== -1) {
          const updated = [...team];
          updated[slotIndex] = {
            ...updated[slotIndex],
            champ: s.placedChamp,
          };
          setTeam(updated);
        }
      }

      if (s.completed && !hasScrolledRef.current) {
        hasScrolledRef.current = true;

        setTimeout(() => {
          setShowResult(true);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resultRef.current?.scrollIntoView({
                behavior: SCROLL_BEHAVIOR,
                block: "center",
              });
            });
          });
        }, SHOW_AND_SCROLL_DELAY_MS);
      }
    } catch {}
  }, [draft]);

  /* -----------------------------
     handlers
  ----------------------------- */

  function handleSelect(a: string) {
    if (completed || disabledAnswers.includes(a)) return;
    setSelected(a);
  }

  function handleLockIn() {
    if (!selected || completed || !correctAnswer) return;

    fetch("/api/skillcheck/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draftId: draft.id,
        correct: selected === correctAnswer,
      }),
    });

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    const isCorrect = selected === correctAnswer;

    if (isCorrect) {
      const isBlue = draft.userTeam === "blue";
      const team = isBlue ? blue : red;
      const setTeam = isBlue ? setBlue : setRed;

      const slotIndex = team.findIndex((p) => p.role === draft.role);
      if (slotIndex !== -1) {
        const updated = [...team];
        updated[slotIndex] = { ...updated[slotIndex], champ: selected };
        setTeam(updated);
      }

      setCompleted(true);
      setLastWrong(null);

      // success overlay immediately
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1800);

      hasScrolledRef.current = true;
      setTimeout(() => {
        setShowResult(true);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resultRef.current?.scrollIntoView({
              behavior: SCROLL_BEHAVIOR,
              block: "center",
            });
          });
        });
      }, SHOW_AND_SCROLL_DELAY_MS);

      localStorage.setItem(
        `skillcheck:${draft.id}`,
        JSON.stringify({
          attempts: nextAttempts,
          disabledAnswers,
          completed: true,
          placedChamp: selected,
        })
      );

      return;
    }

    const nextDisabled = [...disabledAnswers, selected];
    setDisabledAnswers(nextDisabled);
    setLastWrong(selected);
    setSelected(null);
    setTimeout(() => setLastWrong(null), 400);

    localStorage.setItem(
      `skillcheck:${draft.id}`,
      JSON.stringify({
        attempts: nextAttempts,
        disabledAnswers: nextDisabled,
        completed: false,
      })
    );
  }

  return (
    <>
      {showSuccess && <SuccessOverlay text="LOCKED IN!" />}

   
  
      <div className="relative z-10">
        <Hero
          hero={
            authoring ? (
              <DraftAuthorMain initialStep={authoringStep} />
            ) : (
              <DraftOverlay
                blue={blue}
                red={red}
                role={draft.role}
                userTeam={draft.userTeam}
                solutionChamp={correctAnswer}
                previewChamp={!completed ? selected : null}
                locked={completed}
              />
            )
          }
          content={
            <>
              {!authoring && (
                <ChampOptions
                  question="What champion is the best pick?"
                  answers={answerChamps}
                  selected={selected}
                  locked={completed}
                  correctAnswer={correctAnswer}
                  attempts={attempts}
                  disabledAnswers={disabledAnswers}
                  lastWrong={lastWrong}
                  onSelect={handleSelect}
                  onLock={handleLockIn}
                />
              )}

              <div ref={resultRef}>
                {showResult && (
                  <ResultScreen
                    answers={draft.answers}
                    avgAttempts={avgAttempts}
                    onCreateDraft={(step) => {
                      hasScrolledRef.current = false;
                      setAuthoringStep(step);
                      setAuthoring(true);
                      window.scrollTo({ top: 0 });
                    }}
                  />
                )}
              </div>
            </>
          }
        />
      </div>
    </>
  );
}
