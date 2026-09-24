"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { ChevronLeft, RefreshCw } from "lucide-react";
import type { WhatNowCandidate } from "@/lib/whatNow";
import { engineForChoice, guideProgress, type MoodEngine } from "@/lib/whatNowEngines";
import { mergeFilters, pickManyFromFilter, type SurveyChoice, type SurveyTree, type WhatNowFilter } from "@/lib/whatNowSurvey";
import styles from "./studio.module.css";

type Frame = {
  engineId: string;
  beatIndex: number;
  filters: WhatNowFilter[];
  suggestion: WhatNowCandidate | null | undefined;
  suggestions: WhatNowCandidate[];
  seen: string[];
  stepIndex: number;
  walking: boolean;
};

async function loadJson<T>(url: string, failed: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(failed);
  return response.json() as Promise<T>;
}

export default function WhatNowSurvey({ onClose, onOpenIdea }: { onClose: () => void; onOpenIdea: (id: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [tree, setTree] = useState<SurveyTree | null>(null);
  const [pool, setPool] = useState<WhatNowCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [engineId, setEngineId] = useState("");
  const [beatIndex, setBeatIndex] = useState(0);
  const [filters, setFilters] = useState<WhatNowFilter[]>([]);
  const [history, setHistory] = useState<Frame[]>([]);
  const [suggestion, setSuggestion] = useState<WhatNowCandidate | null | undefined>(undefined);
  const [suggestions, setSuggestions] = useState<WhatNowCandidate[]>([]);
  const [seen, setSeen] = useState<string[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [walking, setWalking] = useState(false);
  const [settled, setSettled] = useState(false);
  const [fade, setFade] = useState<"wait" | "out" | "in">("wait");
  const [shown, setShown] = useState<ReactNode>(null);
  const copyRef = useRef<ReactNode>(null);
  const shownKey = useRef("");
  const firstCopy = useRef(true);
  const docked = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const engine = engineForChoice(engineId);
  const beat = engine?.beats[beatIndex];
  const atEnd = Boolean(engine && beatIndex >= engine.beats.length);
  const questionId = beat?.kind === "ask" ? beat.questionId ?? "" : engine ? "" : tree?.start ?? "";
  const question = beat?.kind === "ask" && beat.choices?.length
    ? { id: "inline", prompt: beat.prompt ?? "", choices: beat.choices }
    : questionId ? tree?.questions[questionId] : undefined;
  const pace = engine?.pace ?? "find";
  const guiding = beat?.kind === "guide" || walking;
  useEffect(() => { dialog.current?.showModal(); }, []);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setSettled(true), reduce ? 0 : 980);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    void Promise.all([
      loadJson<SurveyTree>("/api/admin/what-now/survey", "Could not load the survey."),
      loadJson<WhatNowCandidate[]>("/api/admin/what-now/pool", "Could not load activities."),
    ]).then(([survey, items]) => {
      setTree(survey);
      setPool(items);
    }).catch(error => setError((error as Error).message)).finally(() => setLoading(false));
  }, []);
  function snapshot(): Frame {
    return { engineId, beatIndex, filters, suggestion, suggestions, seen, stepIndex, walking };
  }
  function remember() {
    setHistory(current => [...current, snapshot()]);
  }
  function land(nextEngine: MoodEngine, nextEngineId: string, index: number, nextFilters: WhatNowFilter[], current: WhatNowCandidate | null, nextSeen: string[]) {
    let i = index;
    let picks = current ? [current] : [];
    let nextSeenKeys = nextSeen;
    const landing = nextEngine.beats[i];
    if (landing?.kind === "pick") {
      picks = pickManyFromFilter(pool, mergeFilters(nextFilters), nextSeenKeys);
      nextSeenKeys = [...nextSeenKeys, ...picks.map(item => `${item.source}:${item.id}`)];
      i = picks.length ? i + 1 : nextEngine.beats.length;
    }
    setEngineId(nextEngineId);
    setBeatIndex(i);
    setFilters(nextFilters);
    setSuggestion(picks[0] ?? null);
    setSuggestions(picks);
    setSeen(nextSeenKeys);
    setStepIndex(0);
    setWalking(false);
  }
  function choose(choice: SurveyChoice) {
    remember();
    const nextFilters = choice.filter ? [...filters, choice.filter] : filters;
    if (!engine) {
      const next = engineForChoice(choice.id);
      if (next) {
        const startFilters = choice.id === "feel-work" ? [{ minEnergy: 5 }] : nextFilters;
        land(next, choice.id, 0, startFilters, null, []);
        return;
      }
      if (choice.next) {
        setFilters(nextFilters);
        setEngineId("");
        return;
      }
      setFilters(nextFilters);
      return;
    }
    land(engine, engineId, beatIndex + 1, nextFilters, null, []);
  }
  function continueSay() {
    if (!engine) return;
    remember();
    land(engine, engineId, beatIndex + 1, filters, suggestion ?? null, seen);
  }
  function another() {
    const picks = pickManyFromFilter(pool, mergeFilters(filters), seen);
    if (!picks.length) return;
    const keys = picks.map(item => `${item.source}:${item.id}`);
    setSuggestion(picks[0]);
    setSuggestions(picks);
    setSeen(current => keys.every(key => current.includes(key)) ? keys : [...current, ...keys.filter(key => !current.includes(key))]);
    setStepIndex(0);
    setWalking(false);
  }
  function continueGuide() {
    if (!suggestion) return;
    const progress = guideProgress(suggestion, stepIndex);
    remember();
    if (!progress.last) {
      setStepIndex(progress.index + 1);
      return;
    }
    if (walking) {
      setWalking(false);
      setStepIndex(0);
      return;
    }
    if (engine) land(engine, engineId, beatIndex + 1, filters, suggestion, seen);
  }
  function back() {
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory(current => current.slice(0, -1));
    setEngineId(previous.engineId);
    setBeatIndex(previous.beatIndex);
    setFilters(previous.filters);
    setSuggestion(previous.suggestion);
    setSuggestions(previous.suggestions);
    setSeen(previous.seen);
    setStepIndex(previous.stepIndex);
    setWalking(previous.walking);
  }
  function restart() {
    setEngineId("");
    setBeatIndex(0);
    setFilters([]);
    setHistory([]);
    setSuggestion(undefined);
    setSuggestions([]);
    setSeen([]);
    setStepIndex(0);
    setWalking(false);
  }
  const view = mergeFilters(filters);
  const card = view.result === "card";
  const empty = view.pick === "timeline"
    ? "Nothing on the timeline needs doing in the next few days."
    : view.pick === "timed"
      ? "Nothing on your TikTok list in the next week."
      : view.pick === "list"
        ? "Nothing on your model list right now."
        : engine?.empty ?? "Nothing in your lists fits this. Rest counts.";
  const picks = suggestions.length ? suggestions : suggestion ? [suggestion] : [];
  const showingCards = Boolean(beat?.kind === "result" && picks.length && card);
  const lastSay = beat?.kind === "say" && beatIndex === (engine?.beats.length ?? 0) - 1;
  const showEnd = atEnd && !guiding;
  const showEmpty = showEnd && !suggestion;
  const canBack = history.length > 0 || Boolean(engine);
  const copy = loading ? <p className={styles.surveyHint}>One moment…</p> : error ? <p className={styles.error} role="alert">{error}</p> : showEmpty ? <>
    <p className={styles.surveyPrompt}>{empty}</p>
  </> : beat?.kind === "say" ? <>
    <p className={styles.surveyPrompt}>{beat.text}</p>
    <div className={styles.surveyActions}>
      {lastSay ? <>
        {suggestion?.source === "studio" && <button type="button" className={styles.primary} onClick={() => onOpenIdea(suggestion.id)}>Open it</button>}
        <button type="button" className={styles.surveyContinue} onClick={restart}>Start over</button>
      </> : <button type="button" className={styles.surveyContinue} onClick={continueSay}>{beat.continueLabel ?? "Okay"}</button>}
    </div>
  </> : guiding && suggestion ? <GuideCard item={suggestion} stepIndex={stepIndex} onNext={continueGuide} onOpen={suggestion.source === "studio" ? () => onOpenIdea(suggestion.id) : undefined} /> : beat?.kind === "result" && picks.length && card ? <>
    <div className={picks.length > 1 ? styles.surveyCards : undefined}>
      {picks.map(item => <TaskPreview key={`${item.source}:${item.id}`} item={item} onOpen={item.source === "studio" ? () => onOpenIdea(item.id) : undefined} />)}
    </div>
    <div className={styles.surveyActions}>
      <button type="button" className={styles.surveyChoice} onClick={another}>Switch</button>
    </div>
  </> : beat?.kind === "result" && suggestion ? <>
    <TaskPreview item={suggestion} variant="result" />
    <div className={styles.surveyActions}>
      {suggestion.steps?.length > 0 && <button type="button" className={styles.primary} onClick={() => { remember(); setWalking(true); setStepIndex(0); }}>Walk me through it</button>}
      <button type="button" className={styles.secondary} onClick={another}><RefreshCw size={16} />Another</button>
      {suggestion.source === "studio" && <button type="button" className={styles.primary} onClick={() => onOpenIdea(suggestion.id)}>Open it</button>}
      <button type="button" className={styles.secondary} onClick={restart}>Start over</button>
    </div>
  </> : beat?.kind === "result" && suggestion === null ? <>
    <p className={styles.surveyPrompt}>{empty}</p>
  </> : question ? <>
    <p className={styles.surveyPrompt}>{question.prompt}</p>
    <div className={styles.surveyChoices}>
      {question.choices.map(choice => <button type="button" key={choice.id} className={styles.surveyChoice} onClick={() => choose(choice)}>{choice.label}</button>)}
    </div>
  </> : <p className={styles.surveyHint}>This step is missing.</p>;
  const contentKey = [loading ? "load" : error || "", engineId, String(beatIndex), String(stepIndex), walking ? "w" : "", question?.id ?? "", picks.map(item => `${item.source}:${item.id}`).join(",") || String(suggestion), showEmpty ? "empty" : "", beat?.kind ?? ""].join("|");
  copyRef.current = copy;
  useEffect(() => {
    if (!settled) return;
    if (firstCopy.current) {
      firstCopy.current = false;
      shownKey.current = contentKey;
      setShown(copyRef.current);
      setFade("in");
      return;
    }
    if (shownKey.current === contentKey) return;
    setFade("out");
    const timer = window.setTimeout(() => {
      shownKey.current = contentKey;
      setShown(copyRef.current);
      setFade("in");
    }, 280);
    return () => window.clearTimeout(timer);
  }, [settled, contentKey]);
  useLayoutEffect(() => {
    if (!settled || fade === "wait" || docked.current) return;
    const orb = orbRef.current;
    const slot = slotRef.current;
    const stage = stageRef.current;
    if (!orb || !slot || !stage) return;
    docked.current = true;
    const from = orb.getBoundingClientRect();
    const stageBox = stage.getBoundingClientRect();
    const slotBox = slot.getBoundingClientRect();
    orb.style.left = `${slotBox.left + slotBox.width / 2 - stageBox.left}px`;
    orb.style.top = `${slotBox.top + slotBox.height / 2 - stageBox.top}px`;
    orb.style.width = `${slotBox.width}px`;
    orb.style.height = `${slotBox.height}px`;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const to = orb.getBoundingClientRect();
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    const scale = from.width / Math.max(to.width, 1);
    orb.style.transition = "none";
    orb.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    const play = () => {
      orb.style.transition = "transform .95s cubic-bezier(.22, 1, .36, 1)";
      orb.style.transform = "translate(0px, 0px) scale(1)";
    };
    requestAnimationFrame(() => requestAnimationFrame(play));
  }, [settled, fade]);
  return <dialog ref={dialog} aria-labelledby="what-now-heading" className={`${styles.dialog} ${styles.surveyOverlay}`} onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className={styles.surveyChrome}>
      <h2 id="what-now-heading">What now</h2>
      {canBack && <button type="button" className={styles.surveyBack} aria-label="Back" onClick={history.length ? back : restart}><ChevronLeft size={18} /></button>}
    </div>
    <div ref={stageRef} className={styles.surveyStage} data-pace={pace} data-settled={settled ? "true" : "false"} data-cards={showingCards ? "true" : undefined}>
      <SurveyOrb orbRef={orbRef} />
      <div className={styles.surveyBody}>
        <div ref={slotRef} className={styles.surveyOrbSlot} />
        <div className={styles.surveyCopy} data-fade={fade}>{shown}</div>
      </div>
    </div>
  </dialog>;
}

function SurveyOrb({ orbRef }: { orbRef: RefObject<HTMLDivElement | null> }) {
  return <div ref={orbRef} className={styles.surveyOrb} aria-hidden="true">
    <span className={styles.surveyOrbHalo} />
    <span className={styles.surveyOrbDisc}>
      <span className={styles.surveyOrbSpin}>
        <span className={styles.surveyOrbBlob} data-tone="warm" />
        <span className={styles.surveyOrbBlob} data-tone="rose" />
        <span className={styles.surveyOrbBlob} data-tone="gold" />
      </span>
      <span className={styles.surveyOrbPulse} />
    </span>
  </div>;
}

function TaskPreview({ item, variant = "card", onOpen }: { item: WhatNowCandidate; variant?: "card" | "result"; onOpen?: () => void }) {
  const body = <>
    <h3>{item.title}</h3>
    {item.steps.length ? <ul className={styles.surveyChecklist}>{item.steps.map((step, index) => <li key={`${index}-${step}`}>{step}</li>)}</ul> : null}
  </>;
  const className = variant === "card" ? styles.surveyCard : styles.surveyResult;
  if (onOpen) return <button type="button" className={className} onClick={onOpen}>{body}</button>;
  return <div className={className}>{body}</div>;
}

function GuideCard({ item, stepIndex, onNext, onOpen }: { item: WhatNowCandidate; stepIndex: number; onNext: () => void; onOpen?: () => void }) {
  const progress = guideProgress(item, stepIndex);
  return <>
    <div className={styles.surveyLead}>
      <p className={styles.surveyStepMeta}>Step {progress.index + 1} of {progress.steps.length}</p>
      <p className={styles.surveyHint}>{item.title}</p>
    </div>
    <p className={styles.surveyPrompt}>{progress.text}</p>
    <div className={styles.surveyActions}>
      <button type="button" className={styles.surveyContinue} onClick={onNext}>I did that</button>
      {onOpen && <button type="button" className={styles.secondary} onClick={onOpen}>Open it</button>}
    </div>
  </>;
}
