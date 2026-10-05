"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronRight, Dumbbell, Plus, Sparkles } from "lucide-react";
import styles from "./workout.module.css";

type Exercise = { name: string; reps: string; focus: string; sets: (week: number) => number; startsAt?: number };
type Workout = { title: string; note: string; duration: string; exercises: Exercise[] };
type WorkoutEntry = { id: string; workoutDate: string; exercise: string; sets: number; reps: number; weightKg: number };
type WorkoutDraft = { id?: string; clientId: string; exercise: string; sets: string; reps: string; weightKg: string };

// The first day is recovery. Training begins the following day with Workout B.
const planStart = new Date(2026, 8, 25, 12);
const planEnd = new Date(2026, 10, 19, 12);
const recoveryDelayStorageKey = "workout-recovery-delay-v1";
const primarySets = () => 2;
const secondarySets = () => 2;
const accessorySets = () => 1;
const postureSets = (week: number) => week < 6 ? 1 : 2;

const workouts: Record<"A" | "B", Workout> = {
  A: {
    title: "Glute growth + thighs",
    note: "Your primary glute session. Control each rep; make the last few challenging without losing form.",
    duration: "30–45 minutes",
    exercises: [
      { name: "Hip thrust", reps: "8–12", focus: "Primary glute builder", sets: primarySets },
      { name: "Split squat", reps: "8–12 / leg", focus: "Glutes · thighs", sets: secondarySets },
    ],
  },
  B: {
    title: "Thighs + glute lengthened work",
    note: "Your thigh and posterior-chain session. Keep the dumbbells close and stop before your back rounds.",
    duration: "30–45 minutes",
    exercises: [
      { name: "Sumo squat", reps: "8–12", focus: "Thighs · glutes", sets: primarySets },
      { name: "Lunge", reps: "8–12 / leg", focus: "Glutes · thighs", sets: secondarySets },
    ],
  },
};

const atNoon = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
const formatDate = (date: Date) => date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 12);
function workoutFor(elapsedDays: number): "A" | "B" {
  return Math.floor((elapsedDays - 1) / 2) % 2 === 0 ? "B" : "A";
}

function scheduleFor(today: Date, recoveryDelay: number) {
  const elapsed = Math.max(0, Math.floor((today.getTime() - planStart.getTime()) / 86_400_000) - recoveryDelay);
  const week = Math.min(8, Math.floor(elapsed / 7) + 1);
  const trainingDay = elapsed % 2 === 1;
  let nextDate = today;
  let nextElapsed = elapsed;
  while (nextElapsed % 2 !== 1) {
    nextDate = addDays(nextDate, 1);
    nextElapsed += 1;
  }
  return { trainingDay, workout: workoutFor(elapsed), week, nextDate, nextWorkout: workoutFor(nextElapsed) };
}

const logExercises = ["Hip thrust", "Sumo squat", "Lunge", "Split squat"] as const;
const workoutDateKey = (date: Date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");

function newWorkoutDraft(exercise = "Hip thrust"): WorkoutDraft { return { clientId: crypto.randomUUID(), exercise, sets: "", reps: "", weightKg: "" }; }

function WorkoutLogger({ date, plannedExercises }: { date: Date; plannedExercises: readonly string[] }) {
  const workoutDate = workoutDateKey(date);
  const [rows, setRows] = useState<WorkoutDraft[]>([newWorkoutDraft()]);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setSaved(null); setError("");
    fetch(`/api/admin/workouts?date=${workoutDate}`).then(response => response.ok ? response.json() : Promise.reject(new Error("Could not load this workout log."))).then((entries: WorkoutEntry[]) => {
      if (active) {
        const savedRows = entries.map(entry => ({ id: entry.id, clientId: entry.id, exercise: entry.exercise, sets: String(entry.sets), reps: String(entry.reps), weightKg: String(entry.weightKg) }));
        const plannedRows = plannedExercises.filter(exercise => !savedRows.some(row => row.exercise === exercise)).map(exercise => newWorkoutDraft(exercise));
        setRows([...savedRows, ...plannedRows]);
      }
    }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "Could not load this workout log."); });
    return () => { active = false; };
  }, [workoutDate, plannedExercises]);

  function update(clientId: string, field: keyof Omit<WorkoutDraft, "id" | "clientId">, value: string) { setSaved(null); setRows(current => current.map(row => row.clientId === clientId ? { ...row, [field]: value } : row)); }
  async function save(row: WorkoutDraft) {
    const sets = Number(row.sets), reps = Number(row.reps), weightKg = Number(row.weightKg);
    if (!Number.isInteger(sets) || sets < 1 || !Number.isInteger(reps) || reps < 1 || !Number.isFinite(weightKg) || weightKg < 0) { setError("Use whole numbers for sets and reps, and a non-negative load in kg."); return; }
    setSaving(row.clientId); setSaved(null); setError("");
    try {
      const response = await fetch("/api/admin/workouts", { method: row.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...(row.id ? { id: row.id } : {}), workoutDate, exercise: row.exercise, sets, reps, weightKg }) });
      const result = await response.json().catch(() => ({})); if (!response.ok) throw new Error(result.error ?? "Could not save this exercise.");
      setRows(current => current.map(item => item.clientId === row.clientId ? { ...item, id: result.id } : item)); setSaved(row.clientId);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save this exercise."); } finally { setSaving(null); }
  }
  async function remove(row: WorkoutDraft) {
    if (!row.id) { setRows(current => current.length === 1 ? [newWorkoutDraft()] : current.filter(item => item.clientId !== row.clientId)); return; }
    setSaving(row.clientId); setError("");
    try { const response = await fetch(`/api/admin/workouts?id=${row.id}`, { method: "DELETE" }); if (!response.ok) throw new Error("Could not remove this exercise."); setRows(current => current.length === 1 ? [newWorkoutDraft()] : current.filter(item => item.clientId !== row.clientId)); } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not remove this exercise."); } finally { setSaving(null); }
  }
  return <section className={styles.log} aria-labelledby="workout-log-heading"><div className={styles.logHeading}><div><p>WORKOUT LOG</p><h2 id="workout-log-heading">Record your working sets</h2><span>Add only the exercises you did. Load is in kilograms; use 0 for bodyweight work.</span></div><button type="button" className={styles.addExercise} onClick={() => setRows(current => [...current, newWorkoutDraft()])}>+ Add exercise</button></div><div className={styles.logList}>{rows.map(row => <form key={row.clientId} className={styles.logRow} onSubmit={event => { event.preventDefault(); void save(row); }}><label>Exercise<select aria-label="Exercise" value={row.exercise} onChange={event => update(row.clientId, "exercise", event.target.value)}>{logExercises.map(exercise => <option key={exercise}>{exercise}</option>)}</select></label><label>Sets<input inputMode="numeric" min="1" step="1" type="number" value={row.sets} onChange={event => update(row.clientId, "sets", event.target.value)} placeholder="2" /></label><label>Reps / set<input inputMode="numeric" min="1" step="1" type="number" value={row.reps} onChange={event => update(row.clientId, "reps", event.target.value)} placeholder="10" /></label><label>Load · kg<input inputMode="decimal" min="0" step="0.5" type="number" value={row.weightKg} onChange={event => update(row.clientId, "weightKg", event.target.value)} placeholder="0" /></label><button type="submit" disabled={saving === row.clientId}>{saving === row.clientId ? "Saving…" : saved === row.clientId ? "Saved" : "Save"}</button><button type="button" className={styles.removeExercise} aria-label="Remove exercise" onClick={() => void remove(row)} disabled={saving === row.clientId}>×</button></form>)}</div>{error && <p className={styles.logError} role="alert">{error}</p>}</section>;
}

export default function WorkoutPlan() {
  const [today, setToday] = useState<Date | null>(null);
  const [viewDate, setViewDate] = useState<Date | null>(null);
  const [recoveryDelay, setRecoveryDelay] = useState(0);
  useEffect(() => setToday(atNoon(new Date())), []);
  useEffect(() => {
    const saved = Number(window.localStorage.getItem(recoveryDelayStorageKey));
    if (Number.isInteger(saved) && saved > 0) setRecoveryDelay(saved);
  }, []);
  useEffect(() => {
    if (!today) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.altKey || event.ctrlKey || event.metaKey || target?.matches("input, textarea, select, [contenteditable='true']")) return;
      const current = viewDate ?? today;
      const finalDate = addDays(planEnd, recoveryDelay);
      if (event.key === "ArrowLeft" && current.getTime() > today.getTime()) {
        event.preventDefault();
        setViewDate(addDays(current, -1));
      }
      if (event.key === "ArrowRight" && current.getTime() < finalDate.getTime()) {
        event.preventDefault();
        setViewDate(addDays(current, 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [today, viewDate, recoveryDelay]);
  const displayedDate = viewDate ?? today;
  const schedule = useMemo(() => displayedDate ? scheduleFor(displayedDate, recoveryDelay) : null, [displayedDate, recoveryDelay]);
  if (!schedule || !today || !displayedDate) return <main className={styles.page} />;

  const plan = workouts[schedule.workout];
  const visibleExercises = plan.exercises.filter(exercise => (exercise.startsAt ?? 1) <= schedule.week);
  const effort = schedule.week === 1 ? "Work, but stop with about 3 good reps left." : schedule.week < 4 ? "Stop with about 2 reps left." : "Stop with 1–2 clean reps left.";
  const addRecoveryDay = () => setRecoveryDelay(current => { const next = current + 1; window.localStorage.setItem(recoveryDelayStorageKey, String(next)); setViewDate(null); return next; });
  const warmup = <section className={styles.mobility}><div className={styles.mobilityHeading}><Sparkles size={18} /><div><p>SHORT WARM-UP · 4–5 MIN</p><h3>Do this before every lower-body session</h3><span>Save long holds and band work for after training; this gets you warm without pre-fatiguing your glutes.</span></div></div><div className={styles.mobilityList}><span>Easy march or walk <b>2 min</b></span><span>Cat–cow <b>6 slow reps</b></span><span>Bodyweight squat <b>8 reps</b></span><span>First exercise <b>1 easy practice set</b></span></div></section>;
  const mobility = <section className={styles.mobility}><div className={styles.mobilityHeading}><Sparkles size={18} /><div><p>NIGHTLY POSTURE + BACKBEND PRACTICE · 7–10 MIN</p><h3>Do this about 30 minutes before bed</h3><span>Gentle and unforced. It is separate from strength training; stop any movement that pinches, causes sharp pain, or sends symptoms down an arm or leg.</span></div></div><div className={styles.mobilityList}><span>Chin tucks <b>8 · hold 3 sec</b></span><span>Wall slides <b>8 slow reps</b></span><span>Thoracic extension over a rolled towel <b>6 easy reps</b></span><span>Half-kneeling hip-flexor stretch <b>30 sec / side</b></span><span>Sphinx / prone press-up <b>5 easy reps</b></span><span>Doorway chest stretch <b>30 sec / side</b></span></div></section>;

  if (!schedule.trainingDay) return <main className={styles.page}><header className={styles.header}><div><p className={styles.eyebrow}><span /> {formatDate(displayedDate).toUpperCase()} · YOUR GLUTE-PRIORITY PLAN</p><h1>Recovery <em>day.</em></h1><p className={styles.intro}>Growth happens between sessions. Keep today light; your next lower-body workout is already mapped out.</p></div></header><section className={styles.recoveryCard}><CalendarDays size={22} /><div><p>NEXT SESSION · {formatDate(schedule.nextDate)}</p><h2>Workout {schedule.nextWorkout}</h2><span>{workouts[schedule.nextWorkout].title} · {workouts[schedule.nextWorkout].duration}</span></div><ChevronRight className={styles.recoveryArrow} size={24} /></section>{mobility}</main>;

  return <main className={styles.page}><header className={styles.header}><div><p className={styles.eyebrow}><span /> {formatDate(displayedDate).toUpperCase()} · WEEK {schedule.week} OF 8</p><h1>Workout <em>{schedule.workout}.</em></h1><p className={styles.intro}>{plan.note} Train every second day; recovery days are part of the growth plan.</p></div><div className={styles.headerTools}><div className={styles.weekBadge}><span>Today’s effort</span><strong>{schedule.week === 1 ? "Build your base" : "Progress with good form"}</strong><small>{effort}</small></div><button type="button" className={styles.recoveryButton} onClick={addRecoveryDay}><Plus size={15} />Add an extra recovery day</button></div></header>{warmup}<section className={styles.session}><div className={styles.titleRow}><div className={styles.icon}><Dumbbell size={23} /></div><div><p>TODAY’S SESSION · {plan.duration.toUpperCase()}</p><h2>{plan.title}</h2><span>Every line is repeated for the displayed number of working sets. Rest 1–2 minutes between sets.</span></div></div><div className={styles.exerciseList}>{visibleExercises.map((exercise, index) => <div className={styles.exercise} style={{ cursor: "default" }} key={exercise.name}><span className={styles.number}>{index + 1}</span><span className={styles.exerciseCopy}><strong>{exercise.name}</strong><small>{exercise.focus}</small></span><span className={styles.reps}>{exercise.sets(schedule.week)} sets × {exercise.reps}</span></div>)}</div></section><WorkoutLogger date={displayedDate} plannedExercises={visibleExercises.map(exercise => exercise.name)} />{mobility}</main>;
}
