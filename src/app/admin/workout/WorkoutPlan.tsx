"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronRight, Dumbbell, Sparkles } from "lucide-react";
import styles from "./workout.module.css";

type Exercise = { name: string; range: string; focus: string };
const planStart = new Date(2026, 8, 24, 12);
const workouts: Record<"A" | "B", { title: string; note: string; exercises: Exercise[] }> = {
  A: { title: "Glute strength + shape", note: "Your glute-focused session.", exercises: [{ name: "Supported split squat", range: "8–15 / leg", focus: "Glutes · thighs" }, { name: "Weighted floor glute bridge", range: "10–20", focus: "Glutes" }, { name: "Side-lying band hip abduction", range: "15–25 / side", focus: "Outer glutes" }, { name: "Supported one-arm dumbbell row", range: "10–15 / side", focus: "Posture · upper back" }] },
  B: { title: "Thigh + posterior chain", note: "Your thigh and hamstring-focused session.", exercises: [{ name: "Dumbbell squat", range: "8–15", focus: "Thighs · glutes" }, { name: "Dumbbell Romanian deadlift", range: "10–15", focus: "Glutes · hamstrings" }, { name: "Hamstring walkouts", range: "6–10", focus: "Hamstrings · glutes" }, { name: "Supported one-arm dumbbell row", range: "10–15 / side", focus: "Posture · upper back" }] },
};
const atNoon = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
const formatDate = (date: Date) => date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

export default function WorkoutPlan() {
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(atNoon(new Date())), []);
  const schedule = useMemo(() => { if (!today) return null; const elapsed = Math.max(0, Math.round((today.getTime() - planStart.getTime()) / 86_400_000)); const trainingDay = elapsed % 2 === 0; const sessions = Math.floor(elapsed / 2); const workout: "A" | "B" = sessions % 2 === 0 ? "A" : "B"; return { trainingDay, workout, week: Math.min(8, Math.floor(elapsed / 7) + 1), nextDate: trainingDay ? today : new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 12), nextWorkout: trainingDay ? workout : sessions % 2 === 0 ? "A" : "B" as "A" | "B" }; }, [today]);
  if (!schedule || !today) return <main className={styles.page} />;
  const plan = workouts[schedule.workout]; const sets = schedule.week === 1 ? "1 working set" : schedule.week < 5 ? "2 working sets" : "2 working sets · optional 3rd on exercise 1"; const effort = schedule.week === 1 ? "Leave about 3 good reps." : schedule.week === 2 ? "Leave about 2 good reps." : "Leave 1–2 good reps.";
  const mobility = <section className={styles.mobility}><div className={styles.mobilityHeading}><Sparkles size={18} /><div><p>DAILY MOBILITY · 5–8 MIN</p><h3>Also do this today</h3><span>Gentle, comfortable movement — on training and recovery days.</span></div></div><div className={styles.mobilityList}><span>Pelvic tilts <b>8–10</b></span><span>Gentle cat–cow <b>6–8</b></span><span>Hip-flexor stretch <b>20–30 sec / side</b></span><span>Wall slides <b>8</b></span><span>Easy posing practice <b>5</b></span></div></section>;
  if (!schedule.trainingDay) return <main className={styles.page}><header className={styles.header}><div><p className={styles.eyebrow}><span /> YOUR HOME TRAINING PLAN</p><h1>Recovery <em>day.</em></h1><p className={styles.intro}>Your lower body grows and adapts while you recover. Your next session is already mapped out.</p></div></header><section className={styles.recoveryCard}><CalendarDays size={22} /><div><p>NEXT UP · {formatDate(schedule.nextDate)}</p><h2>Workout {schedule.nextWorkout}</h2><span>{workouts[schedule.nextWorkout].title} · 30–45 minutes</span></div><ChevronRight className={styles.recoveryArrow} size={24} /></section>{mobility}</main>;
  return <main className={styles.page}><header className={styles.header}><div><p className={styles.eyebrow}><span /> {formatDate(today).toUpperCase()} · WEEK {schedule.week} OF 8</p><h1>Workout <em>{schedule.workout}.</em></h1><p className={styles.intro}>{plan.note} Keep a recovery day between sessions.</p></div><div className={styles.weekBadge}><span>Today’s target</span><strong>{sets}</strong><small>{effort}</small></div></header><section className={styles.session}><div className={styles.titleRow}><div className={styles.icon}><Dumbbell size={23} /></div><div><p>TODAY’S SESSION · 30–45 MIN</p><h2>{plan.title}</h2><span>Warm up for 4–5 minutes before the first exercise.</span></div></div><div className={styles.exerciseList}>{plan.exercises.map((exercise, index) => <div className={styles.exercise} style={{ cursor: "default" }} key={exercise.name}><span className={styles.number}>{index + 1}</span><span className={styles.exerciseCopy}><strong>{exercise.name}</strong><small>{exercise.focus}</small></span><span className={styles.reps}>{exercise.range}</span></div>)}</div></section>{mobility}</main>;
}
