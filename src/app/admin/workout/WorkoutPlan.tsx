"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronRight, Dumbbell, Plus, Sparkles } from "lucide-react";
import styles from "./workout.module.css";

type Exercise = { name: string; reps: string; focus: string; sets: (week: number) => number; startsAt?: number };
type Workout = { title: string; note: string; duration: string; exercises: Exercise[] };

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
      { name: "Weighted floor glute bridge", reps: "8–12", focus: "Primary glute builder", sets: primarySets },
      { name: "Supported split squat", reps: "8–12 / leg", focus: "Glutes · thighs", sets: secondarySets },
      { name: "Side-lying band hip abduction", reps: "15–20 / side", focus: "Outer glutes", sets: accessorySets, startsAt: 3 },
      { name: "Supported one-arm dumbbell row", reps: "10–15 / side", focus: "Posture · upper-back support", sets: postureSets, startsAt: 4 },
    ],
  },
  B: {
    title: "Thighs + glute lengthened work",
    note: "Your thigh and posterior-chain session. Keep the dumbbells close and stop before your back rounds.",
    duration: "30–45 minutes",
    exercises: [
      { name: "Dumbbell squat", reps: "8–12", focus: "Thighs · glutes", sets: primarySets },
      { name: "Dumbbell Romanian deadlift", reps: "8–12", focus: "Glutes · hamstrings", sets: secondarySets },
      { name: "Hamstring walkouts", reps: "6–10", focus: "Hamstrings · glutes", sets: accessorySets, startsAt: 3 },
      { name: "Supported one-arm dumbbell row", reps: "10–15 / side", focus: "Posture · upper-back support", sets: postureSets, startsAt: 4 },
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

  return <main className={styles.page}><header className={styles.header}><div><p className={styles.eyebrow}><span /> {formatDate(displayedDate).toUpperCase()} · WEEK {schedule.week} OF 8</p><h1>Workout <em>{schedule.workout}.</em></h1><p className={styles.intro}>{plan.note} Train every second day; recovery days are part of the growth plan.</p></div><div className={styles.headerTools}><div className={styles.weekBadge}><span>Today’s effort</span><strong>{schedule.week === 1 ? "Build your base" : "Progress with good form"}</strong><small>{effort}</small></div><button type="button" className={styles.recoveryButton} onClick={addRecoveryDay}><Plus size={15} />Add an extra recovery day</button></div></header>{warmup}<section className={styles.session}><div className={styles.titleRow}><div className={styles.icon}><Dumbbell size={23} /></div><div><p>TODAY’S SESSION · {plan.duration.toUpperCase()}</p><h2>{plan.title}</h2><span>Every line is repeated for the displayed number of working sets. Rest 1–2 minutes between sets.</span></div></div><div className={styles.exerciseList}>{visibleExercises.map((exercise, index) => <div className={styles.exercise} style={{ cursor: "default" }} key={exercise.name}><span className={styles.number}>{index + 1}</span><span className={styles.exerciseCopy}><strong>{exercise.name}</strong><small>{exercise.focus}</small></span><span className={styles.reps}>{exercise.sets(schedule.week)} sets × {exercise.reps}</span></div>)}</div></section>{mobility}</main>;
}
