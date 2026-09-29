"use client";

import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Dumbbell, ListChecks, Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HourTimeInput, clockLabel, normalizeHour } from "../HourTimeInput";
import styles from "./today.module.css";

type Meal = { id: string; date: string; slot: string; title: string; status: string };
type StudioItem = { id: string; title: string; plannedDate: string; platform: string; energy: number | null };
type OutsideMeal = { id: string; name: string; date: string; slot: string };
type Appointment = { id: string; title: string; details: string; date: string; time: string };
type View = "day" | "month";

const slotLabel: Record<string, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const planStart = new Date(2026, 8, 25, 12);

function dateKey(date: Date) { return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-"); }
function dateAt(key: string) { return new Date(`${key}T12:00:00`); }
function displayDate(key: string) { return dateAt(key).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }); }
function workoutFor(key: string) {
  const elapsed = Math.max(0, Math.floor((dateAt(key).getTime() - planStart.getTime()) / 86_400_000));
  if (elapsed % 2 !== 1) return null;
  return Math.floor((elapsed - 1) / 2) % 2 === 0 ? "Workout B" : "Workout A";
}

export default function TodayBoard({ initialDate, meals, studioItems, outsideMeals, appointments }: { initialDate: string; meals: Meal[]; studioItems: StudioItem[]; outsideMeals: OutsideMeal[]; appointments: Appointment[] }) {
  const [view, setView] = useState<View>("day");
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const selectedMeals = meals.filter(item => item.date === selectedDate);
  const selectedOutside = outsideMeals.filter(item => item.date === selectedDate);
  const selectedStudio = studioItems.filter(item => item.plannedDate === selectedDate);
  const selectedWorkout = workoutFor(selectedDate);
  const month = useMemo(() => {
    const date = dateAt(initialDate);
    const first = new Date(date.getFullYear(), date.getMonth(), 1, 12);
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0, 12);
    const leading = (first.getDay() + 6) % 7;
    return { label: first.toLocaleDateString(undefined, { month: "long", year: "numeric" }), days: Array.from({ length: leading + last.getDate() }, (_, i) => i < leading ? null : new Date(date.getFullYear(), date.getMonth(), i - leading + 1, 12)) };
  }, [initialDate]);

  return <main className={styles.page}>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>YOUR DAILY OVERVIEW</p><h1>Today<span>.</span></h1><p className={styles.intro}>The few things worth noticing now. Open a section only when you need the detail.</p></div>
      <div className={styles.headerTools}>
        <button type="button" className={styles.newAppointment} onClick={() => setAppointmentOpen(true)}><Plus size={15} />New appointment</button>
        <div className={styles.switcher} aria-label="Calendar view">
          <button type="button" data-active={view === "day" || undefined} onClick={() => setView("day")}>Day</button>
          <button type="button" data-active={view === "month" || undefined} onClick={() => setView("month")}>Month</button>
        </div>
      </div>
    </header>

    {view === "day" ? <DayOverview date={selectedDate} meals={selectedMeals} outsideMeals={selectedOutside} studioItems={selectedStudio} appointments={appointments.filter(item => item.date === selectedDate)} workout={selectedWorkout} /> : <>
      <section className={styles.monthHeader}><div><p>{month.label}</p><small>Click a day to inspect its planned items.</small></div><div className={styles.monthKeys}><span><i data-kind="meal" /> Meals</span><span><i data-kind="studio" /> Studio</span><span><i data-kind="workout" /> Workout</span><span><i data-kind="appointment" /> Appointments</span></div></section>
      <section className={styles.calendar} aria-label={`${month.label} calendar`}>
        {weekdays.map(day => <p key={day} className={styles.weekday}>{day}</p>)}
        {month.days.map((day, index) => day ? <CalendarDay key={dateKey(day)} date={dateKey(day)} today={initialDate} selected={selectedDate} meals={meals} studioItems={studioItems} outsideMeals={outsideMeals} appointments={appointments} onSelect={() => { setSelectedDate(dateKey(day)); setView("day"); }} /> : <div key={`blank-${index}`} className={styles.blank} />)}
      </section>
    </>}
    {appointmentOpen && <AppointmentDialog defaultDate={selectedDate} onClose={() => setAppointmentOpen(false)} />}
  </main>;
}

function DayOverview({ date, meals, outsideMeals, studioItems, appointments, workout }: { date: string; meals: Meal[]; outsideMeals: OutsideMeal[]; studioItems: StudioItem[]; appointments: Appointment[]; workout: string | null }) {
  return <><section className={styles.selectedDate}><CalendarDays size={18} /><div><p>{date === dateKey(new Date()) ? "TODAY" : "SELECTED DAY"}</p><h2>{displayDate(date)}</h2></div><div className={styles.mealBoxes}>{(["lunch", "dinner"] as const).map(slot => { const planned = meals.find(item => item.slot === slot); const outside = outsideMeals.find(item => item.slot === slot); const title = planned?.title ?? outside?.name; return <Link key={slot} href="/admin/health" className={styles.mealBox}><span>{slotLabel[slot]}</span><strong data-empty={!title || undefined}>{title ?? "Nothing planned"}</strong></Link>; })}</div></section><section className={styles.overviewGrid}>
    <div className={styles.appointmentCard}><div className={styles.cardTitle}><CalendarDays size={19} /><span>Appointments</span></div>{appointments.length ? <ul>{appointments.map(item => <li key={item.id}><strong>{clockLabel(item.time)} · {item.title}</strong>{item.details && <span>{item.details}</span>}</li>)}</ul> : <span>No appointment scheduled.</span>}</div>
    <OverviewCard className={styles.studioBoard} icon={<ListChecks size={19} />} label="Studio" href="/admin/studio"><TaskColumns items={studioItems} /></OverviewCard>
    <OverviewCard icon={<Dumbbell size={19} />} label="Workout" href="/admin/workout"><strong>{workout ?? "Recovery day"}</strong><span>{workout ? "Open your session and log it when this is ready." : "Your next session is already in the workout plan."}</span></OverviewCard>
  </section><section className={styles.note}><p>Keep this page as an overview. Planning, editing, nutrition, stock, and workout detail stay in their own sections.</p></section></>;
}

function OverviewCard({ icon, label, href, className, children }: { icon: React.ReactNode; label: string; href: string; className?: string; children: React.ReactNode }) { return <Link className={[styles.overviewCard, className].filter(Boolean).join(" ")} href={href}><div className={styles.cardTitle}>{icon}<span>{label}</span><ChevronRight size={16} /></div><div className={styles.cardBody}>{children}</div></Link>; }
function TaskColumns({ items }: { items: StudioItem[] }) {
  if (!items.length) return <span>No Studio item scheduled.</span>;
  const rows = Array.from({ length: Math.ceil(items.length / 2) }, (_, index) => items.slice(index * 2, index * 2 + 2));
  return <div className={styles.taskRows}>{rows.map(pair => <div key={pair.map(item => item.id).join("-")} className={styles.taskRow}>{pair.map((item, index) => { const swatch = <span className={styles.taskSwatch} data-platform={item.platform} />; const name = <span className={styles.taskName}>{item.title}</span>; return <span key={item.id} className={styles.taskSide} data-side={index === 0 ? "left" : "right"}>{index === 0 ? <>{name}{swatch}</> : <>{swatch}{name}</>}</span>; })}</div>)}</div>;
}
function CalendarDay({ date, today, selected, meals, studioItems, outsideMeals, appointments, onSelect }: { date: string; today: string; selected: string; meals: Meal[]; studioItems: StudioItem[]; outsideMeals: OutsideMeal[]; appointments: Appointment[]; onSelect: () => void }) {
  const mealCount = meals.filter(item => item.date === date).length + outsideMeals.filter(item => item.date === date).length;
  const studioCount = studioItems.filter(item => item.plannedDate === date).length;
  const workout = workoutFor(date);
  const dayAppointments = appointments.filter(item => item.date === date);
  return <button type="button" className={styles.calendarDay} data-today={date === today || undefined} data-selected={date === selected || undefined} onClick={onSelect}><strong>{dateAt(date).getDate()}</strong><div className={styles.dots}>{mealCount > 0 && <span data-kind="meal">{mealCount > 1 ? mealCount : ""}</span>}{studioCount > 0 && <span data-kind="studio">{studioCount > 1 ? studioCount : ""}</span>}{workout && <span data-kind="workout" />}{dayAppointments.slice(0, 2).map(item => <span key={item.id} data-kind="appointment">{clockLabel(item.time)} {item.title}</span>)}</div></button>;
}

function AppointmentDialog({ defaultDate, onClose }: { defaultDate: string; onClose: () => void }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { dialog.current?.showModal(); }, []);
  async function save(event: React.FormEvent) { event.preventDefault(); if (saving) return; const plannedTime = normalizeHour(time); if (!plannedTime) { setError("Use 24-hour time, like 14:30."); return; } setSaving(true); setError(""); try { const response = await fetch("/api/admin/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plannedDate: date, plannedTime, title, notes: details }) }); const result = await response.json().catch(() => ({})); if (!response.ok) throw new Error(result.error ?? "Could not save the appointment."); router.refresh(); onClose(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save the appointment."); setSaving(false); } }
  return <dialog ref={dialog} className={styles.dialog} onCancel={event => { event.preventDefault(); if (!saving) onClose(); }} onPointerDown={event => { if (event.target === event.currentTarget && !saving) onClose(); }}><form className={styles.dialogPanel} onSubmit={save}><div className={styles.dialogTitle}><div><p>APPOINTMENT</p><h2>New appointment</h2></div><button type="button" aria-label="Close" onClick={onClose} disabled={saving}><X size={18} /></button></div><label>Event name<input required autoFocus maxLength={180} value={title} onChange={event => setTitle(event.target.value)} placeholder="What is happening?" /></label><div className={styles.formRow}><label>Date<input required type="date" value={date} onChange={event => setDate(event.target.value)} /></label><label>Time<HourTimeInput required value={time} onChange={setTime} /></label></div><label>Details<textarea maxLength={5000} rows={4} value={details} onChange={event => setDetails(event.target.value)} placeholder="Anything useful to remember" /></label>{error && <p className={styles.error} role="alert">{error}</p>}<div className={styles.dialogActions}><button type="button" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" disabled={saving || !title.trim() || !date || !time}>{saving ? "Saving…" : "Save appointment"}</button></div></form></dialog>;
}
