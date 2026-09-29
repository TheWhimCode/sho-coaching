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
function displayDate(key: string) { return dateAt(key).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }); }
function workoutFor(key: string) {
  const elapsed = Math.max(0, Math.floor((dateAt(key).getTime() - planStart.getTime()) / 86_400_000));
  if (elapsed % 2 !== 1) return null;
  return Math.floor((elapsed - 1) / 2) % 2 === 0 ? "Workout B" : "Workout A";
}

export default function TodayBoard({ initialDate, meals, studioItems, outsideMeals, appointments }: { initialDate: string; meals: Meal[]; studioItems: StudioItem[]; outsideMeals: OutsideMeal[]; appointments: Appointment[] }) {
  const [view, setView] = useState<View>("day");
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [monthCursor, setMonthCursor] = useState(() => { const date = dateAt(initialDate); return { year: date.getFullYear(), month: date.getMonth() }; });
  const [monthDir, setMonthDir] = useState<"next" | "prev" | "">("");
  const monthPane = useRef<HTMLDivElement>(null);
  const monthSwipe = useRef<{ x: number; y: number; pointer: number; active: boolean } | null>(null);
  const monthSwiped = useRef(false);
  const narrow = useRef(false);
  const selectedMeals = meals.filter(item => item.date === selectedDate);
  const selectedOutside = outsideMeals.filter(item => item.date === selectedDate);
  const selectedStudio = studioItems.filter(item => item.plannedDate === selectedDate);
  const selectedWorkout = workoutFor(selectedDate);
  const month = useMemo(() => {
    const first = new Date(monthCursor.year, monthCursor.month, 1, 12);
    const last = new Date(monthCursor.year, monthCursor.month + 1, 0, 12);
    const leading = (first.getDay() + 6) % 7;
    return { label: first.toLocaleDateString("en-US", { month: "long", year: "numeric" }), days: Array.from({ length: leading + last.getDate() }, (_, i) => i < leading ? null : new Date(monthCursor.year, monthCursor.month, i - leading + 1, 12)) };
  }, [monthCursor]);
  function shiftMonth(offset: number) {
    setMonthDir(offset > 0 ? "next" : "prev");
    setMonthCursor(current => { const date = new Date(current.year, current.month + offset, 1, 12); return { year: date.getFullYear(), month: date.getMonth() }; });
  }
  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px)");
    const apply = () => { narrow.current = query.matches; };
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
  useEffect(() => {
    if (view !== "month") return;
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || appointmentOpen) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, textarea, select, [contenteditable='true'], dialog")) return;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); shiftMonth(1); }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); shiftMonth(-1); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, appointmentOpen]);
  useEffect(() => {
    const node = monthPane.current;
    if (!node) return;
    let lockedUntil = 0;
    function onWheel(event: WheelEvent) {
      if (!narrow.current) return;
      if (Math.abs(event.deltaY) < 16 && Math.abs(event.deltaX) < 16) return;
      event.preventDefault();
      const now = Date.now();
      if (now < lockedUntil) return;
      lockedUntil = now + 380;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      shiftMonth(delta > 0 ? 1 : -1);
    }
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [view]);
  function monthSwipeStart(event: React.PointerEvent<HTMLElement>) {
    if (!narrow.current) return;
    monthSwipe.current = { x: event.clientX, y: event.clientY, pointer: event.pointerId, active: false };
  }
  function monthSwipeMove(event: React.PointerEvent<HTMLElement>) {
    const start = monthSwipe.current;
    if (!start || start.pointer !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.active) {
      if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
      if (Math.abs(dy) > Math.abs(dx)) { monthSwipe.current = null; return; }
      start.active = true;
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* The pointer can already be gone. */ }
    }
  }
  function monthSwipeEnd(event: React.PointerEvent<HTMLElement>) {
    const start = monthSwipe.current;
    monthSwipe.current = null;
    if (!start?.active) return;
    monthSwiped.current = true;
    const dx = event.clientX - start.x;
    if (dx <= -48) shiftMonth(1);
    else if (dx >= 48) shiftMonth(-1);
  }

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

    {view === "day" ? <DayOverview date={selectedDate} meals={selectedMeals} outsideMeals={selectedOutside} studioItems={selectedStudio} appointments={appointments.filter(item => item.date === selectedDate)} workout={selectedWorkout} /> : <div ref={monthPane} className={styles.monthPane}>
      <section className={styles.monthHeader}><div className={styles.monthNav}><button type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)}><ChevronLeft size={18} /></button><div><p>{month.label}</p><small>Click a day to inspect its planned items.</small></div><button type="button" aria-label="Next month" onClick={() => shiftMonth(1)}><ChevronRight size={18} /></button></div></section>
      <section key={month.label} className={styles.calendar} data-dir={monthDir || undefined} aria-label={`${month.label} calendar`} onPointerDown={monthSwipeStart} onPointerMove={monthSwipeMove} onPointerUp={monthSwipeEnd} onPointerCancel={() => { monthSwipe.current = null; }} onClickCapture={event => { if (!monthSwiped.current) return; monthSwiped.current = false; event.preventDefault(); event.stopPropagation(); }}>
        {weekdays.map(day => <p key={day} className={styles.weekday}>{day}</p>)}
        {month.days.map((day, index) => day ? <CalendarDay key={dateKey(day)} date={dateKey(day)} today={initialDate} selected={selectedDate} studioItems={studioItems} appointments={appointments} onSelect={() => { setSelectedDate(dateKey(day)); setView("day"); }} /> : <div key={`blank-${index}`} className={styles.blank} />)}
      </section>
    </div>}
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
function CalendarDay({ date, today, selected, studioItems, appointments, onSelect }: { date: string; today: string; selected: string; studioItems: StudioItem[]; appointments: Appointment[]; onSelect: () => void }) {
  const blocks = studioItems.filter(item => item.plannedDate === date);
  const dayAppointments = appointments.filter(item => item.date === date).sort((a, b) => a.time.localeCompare(b.time));
  const extra = Math.max(0, dayAppointments.length - 2);
  return <button type="button" className={styles.calendarDay} data-today={date === today || undefined} data-selected={date === selected || undefined} onClick={onSelect} aria-label={displayDate(date)}><div className={styles.blockArea}><strong>{dateAt(date).getDate()}</strong>{blocks.map(item => <span key={item.id} className={styles.monthBlock} data-platform={item.platform} />)}</div><div className={styles.appointmentRows}><div>{dayAppointments[0] && <span>{clockLabel(dayAppointments[0].time)} {dayAppointments[0].title}</span>}</div><div>{dayAppointments[1] && <span>{clockLabel(dayAppointments[1].time)} {dayAppointments[1].title}</span>}{extra > 0 && <em className={styles.appointmentMore}>+{extra}</em>}</div></div></button>;
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
