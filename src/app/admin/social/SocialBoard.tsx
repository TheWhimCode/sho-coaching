"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, useDraggable, useDroppable, DragOverlay, type DragEndEvent } from "@dnd-kit/core";
import { Check, ChevronLeft, ChevronRight, Eye, GripVertical, Heart, House, Plus, Search, Sparkles, Trash2, Utensils, X } from "lucide-react";
import { FaTiktok, FaXTwitter, FaRedditAlien } from "react-icons/fa6";
import { isLifePlatform, isSocialPlatform, isVtubePlatform, type SocialIdea, type SocialIdeaInput } from "@/lib/socialIdeas";
import styles from "./social.module.css";

const socials = [
  { id: "tiktok", name: "TikTok", caption: "The next good take", Icon: FaTiktok },
  { id: "twitter", name: "X / Twitter", caption: "Thoughts worth sharing", Icon: FaXTwitter },
  { id: "reddit", name: "Reddit", caption: "Start a conversation", Icon: FaRedditAlien },
] as const;
const life = [
  { id: "selfcare", name: "Self care", caption: "Protect your energy", Icon: Heart },
  { id: "food", name: "Food", caption: "Meals and groceries", Icon: Utensils },
  { id: "home", name: "Home", caption: "Keep the place running", Icon: House },
] as const;
const vtubing = [
  { id: "vtubing", name: "VTubing", caption: "Streams, models, lore", Icon: Sparkles },
] as const;
const catalog = { social: socials, life, vtubing };
const pages = ["social", "life", "vtubing"] as const;
const categories = [...socials, ...life, ...vtubing];
type Platform = SocialIdeaInput["platform"];
type BoardPage = (typeof pages)[number];
const pageKey = "admin-social-board-page";
const pageStart: Record<BoardPage, Platform> = { social: "tiktok", life: "selfcare", vtubing: "vtubing" };
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function dayAt(key: string, offset: number) { const date = new Date(`${key}T12:00:00`); date.setDate(date.getDate() + offset); return date; }
function monthDay(key: string) { const date = dayAt(key, 0); return `${months[date.getMonth()]} ${date.getDate()}`; }
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json" }, cache: "no-store" });
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(response.status === 401 ? "Your session expired. Sign in again." : body.error || "Something went wrong. Try again."); }
  return response.status === 204 ? undefined as T : response.json();
}

function IdeaEditor({ idea, platform, onClose, onSaved, onDelete }: { idea: SocialIdea | null; platform: Platform; onClose: () => void; onSaved: (idea: SocialIdea) => void; onDelete: () => Promise<void> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<SocialIdeaInput>(idea ? { title: idea.title, notes: idea.notes, platform: idea.platform, checklist: idea.checklist, plannedDate: idea.plannedDate } : { title: "", notes: "", platform, checklist: [], plannedDate: null });
  const [reading, setReading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const lifeDraft = isLifePlatform(draft.platform);
  useEffect(() => { dialog.current?.showModal(); }, []);
  function taskChange(id: string, values: Partial<SocialIdeaInput["checklist"][number]>) { setDraft(d => ({ ...d, checklist: d.checklist.map(task => task.id === id ? { ...task, ...values } : task) })); }
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (saving) return;
    setSaving(true); setError("");
    try { onSaved(await request<SocialIdea>(`/api/admin/social${idea ? `/${idea.id}` : ""}`, { method: idea ? "PATCH" : "POST", body: JSON.stringify(draft) })); }
    catch (error) { setError((error as Error).message); setSaving(false); }
  }
  return <dialog ref={dialog} aria-labelledby="idea-heading" className={`${styles.dialog} ${reading ? styles.readingDialog : ""}`} onCancel={event => { event.preventDefault(); if (reading) setReading(false); else if (!saving) onClose(); }}>
    {reading ? <>
      <div className={styles.dialogHeading}><span>Recording view</span><button className={styles.secondary} onClick={() => setReading(false)}>Back to editor</button></div>
      <div className={styles.readingContent}><h2 id="idea-heading">{draft.title || "Untitled"}</h2>{draft.notes && <p>{draft.notes}</p>}<ul>{draft.checklist.map(task => <li key={task.id} data-done={task.done}><span>{task.done ? "☑" : "☐"}</span>{task.text}</li>)}</ul></div>
    </> : <form onSubmit={save}>
      <div className={styles.dialogHeading}><h2 id="idea-heading">{idea ? (lifeDraft ? "Edit task" : "Edit idea") : (lifeDraft ? "A new task" : "A new idea")}</h2><button type="button" aria-label="Close editor" disabled={saving} onClick={onClose} className={styles.iconButton}><X size={20} /></button></div>
      <fieldset disabled={saving} className={styles.editorFields}>
        <label className={styles.field}>Title<input autoFocus required maxLength={180} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder={lifeDraft ? "What's the task?" : "What's the idea?"} /></label>
        <div className={styles.checklistEditor}><h3>Checklist</h3>{draft.checklist.map((task, index) => <div className={styles.taskEditor} key={task.id}>
          <input type="checkbox" aria-label={`Complete task ${index + 1}`} checked={task.done} onChange={e => taskChange(task.id, { done: e.target.checked })} />
          <input aria-label={`Task ${index + 1}`} required maxLength={500} value={task.text} placeholder="What do you need to do?" onChange={e => taskChange(task.id, { text: e.target.value })} />
          <button type="button" className={styles.iconButton} aria-label={`Remove task ${index + 1}`} onClick={() => setDraft(d => ({ ...d, checklist: d.checklist.filter(item => item.id !== task.id) }))}><X size={16} /></button>
        </div>)}<button type="button" className={styles.addCard} disabled={draft.checklist.length >= 100} onClick={() => setDraft(d => ({ ...d, checklist: [...d.checklist, { id: crypto.randomUUID(), text: "", done: false }] }))}><Plus size={16} />Add a task</button></div>
        <label className={styles.field}>Description<textarea rows={5} maxLength={5000} placeholder={lifeDraft ? "Notes, reminders, details…" : "Your hook, script, and talking points…"} value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></label>
        <label className={styles.field}>Timeline placement<input type="date" value={draft.plannedDate ?? ""} onChange={e => setDraft({ ...draft, plannedDate: e.target.value || null })} /></label>
        {draft.plannedDate && <button type="button" className={styles.secondary} onClick={() => setDraft({ ...draft, plannedDate: null })}>Remove from timeline</button>}
      </fieldset>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {idea && <div className={styles.deleteConfirm}>{confirmDelete ? <><span>Delete this {lifeDraft ? "task" : "idea"}?</span><button type="button" disabled={saving} onClick={async () => { setSaving(true); try { await onDelete(); } catch (error) { setError((error as Error).message); setSaving(false); } }}>Delete</button><button type="button" onClick={() => setConfirmDelete(false)}>Keep</button></> : <button type="button" onClick={() => setConfirmDelete(true)}><Trash2 size={14} /> Delete {lifeDraft ? "task" : "idea"}</button>}</div>}
      <div className={styles.dialogFooter}><button type="button" className={styles.secondary} disabled={saving} onClick={() => setReading(true)}><Eye size={16} />Recording view</button><button className={styles.primary} disabled={saving || !draft.title.trim()}><Check size={16} />{saving ? "Saving…" : lifeDraft ? "Save task" : "Save idea"}</button></div>
    </form>}
  </dialog>;
}

function sortPlaced(ideas: SocialIdea[]) {
  return [...ideas].sort((a, b) => (a.placedAt ?? a.createdAt).localeCompare(b.placedAt ?? b.createdAt) || a.id.localeCompare(b.id));
}
function dayGrid(count: number) {
  if (count <= 2) return { columns: Math.max(count, 1), rows: 1 };
  const size = Math.ceil(Math.sqrt(count));
  return { columns: size, rows: size };
}
const tileGap = 1;
function splitAxis(total: number, count: number, gap: number) {
  const leftover = Math.max(0, total - gap * Math.max(count - 1, 0));
  const base = Math.floor(leftover / Math.max(count, 1));
  const extra = leftover - base * count;
  return Array.from({ length: count }, (_, index) => base + (index >= count - extra ? 1 : 0));
}
function tileRect(widths: number[], heights: number[], gap: number, column: number, row: number) {
  return {
    left: widths.slice(0, column).reduce((sum, size) => sum + size + gap, 0),
    top: heights.slice(0, row).reduce((sum, size) => sum + size + gap, 0),
    width: widths[column],
    height: heights[row],
  };
}
function DayTiles({ ideas }: { ideas: SocialIdea[] }) {
  const placed = sortPlaced(ideas);
  const { columns, rows } = dayGrid(placed.length);
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0, dpr: 1 });
  useLayoutEffect(() => {
    const node = box.current;
    if (!node) return;
    const apply = (width: number, height: number, dpr: number) => {
      setSize(current => current.width === width && current.height === height && current.dpr === dpr ? current : { width, height, dpr });
    };
    const fromNode = () => {
      const dpr = window.devicePixelRatio || 1;
      apply(Math.round(node.clientWidth * dpr), Math.round(node.clientHeight * dpr), dpr);
    };
    fromNode();
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      const device = entry.devicePixelContentBoxSize?.[0];
      const dpr = window.devicePixelRatio || 1;
      if (device) apply(device.inlineSize, device.blockSize, dpr);
      else fromNode();
    });
    try { observer.observe(node, { box: "device-pixel-content-box" }); }
    catch { observer.observe(node); }
    return () => observer.disconnect();
  }, [placed.length]);
  const gap = Math.max(1, Math.round(tileGap * size.dpr));
  const widths = size.width ? splitAxis(size.width, columns, gap) : [];
  const heights = size.height ? splitAxis(size.height, rows, gap) : [];
  return <div className={styles.daySquare}>
    <div ref={box} className={styles.dayBlock}>
      {placed.map((idea, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const rect = widths.length && heights.length ? tileRect(widths, heights, gap, column, row) : null;
        const style = rect ? { left: rect.left / size.dpr, top: rect.top / size.dpr, width: rect.width / size.dpr, height: rect.height / size.dpr } : { visibility: "hidden" as const };
        return <span key={idea.id} data-platform={idea.platform} className={styles.segment} style={style} />;
      })}
    </div>
  </div>;
}
function TimelineDay({ date, ideas, disabled, onOpen }: { date: Date; ideas: SocialIdea[]; disabled: boolean; onOpen: () => void }) {
  const key = dateKey(date);
  const { setNodeRef, isOver } = useDroppable({ id: key, disabled });
  return <div ref={setNodeRef} className={`${styles.timelineDay} ${isOver ? styles.dropOver : ""}`} data-today={key === dateKey(new Date())}>
    <div className={styles.dayHit} role="button" tabIndex={0} onClick={onOpen} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen(); } }} aria-label={`Open ${weekdays[date.getDay()]} ${date.getDate()}`}>
      <div className={styles.dayLabel}>{weekdays[date.getDay()]}<strong>{date.getDate()}</strong></div>
      <DayTiles ideas={ideas} />
    </div>
  </div>;
}
function DayFocus({ date, ideas, disabled, onBack, onOpenIdea }: { date: Date; ideas: SocialIdea[]; disabled: boolean; onBack: () => void; onOpenIdea: (idea: SocialIdea) => void }) {
  const key = dateKey(date);
  const { setNodeRef, isOver } = useDroppable({ id: key, disabled });
  const placed = sortPlaced(ideas);
  const { columns, rows } = dayGrid(placed.length);
  const socialCount = placed.filter(idea => isSocialPlatform(idea.platform)).length;
  const lifeCount = placed.filter(idea => isLifePlatform(idea.platform)).length;
  const vtubeCount = placed.filter(idea => isVtubePlatform(idea.platform)).length;
  const checks = placed.reduce((total, idea) => total + idea.checklist.length, 0);
  const checksDone = placed.reduce((total, idea) => total + idea.checklist.filter(task => task.done).length, 0);
  const mix = [socialCount && `${socialCount} social`, lifeCount && `${lifeCount} life`, vtubeCount && `${vtubeCount} VTubing`].filter(Boolean);
  const mixText = mix.length ? ` · ${mix.join(" · ")}` : "";
  return <div className={styles.dayFocus}>
    <div className={styles.dayFocusTop}><button type="button" className={styles.dayBack} onClick={onBack}><ChevronLeft size={16} />Back</button></div>
    <div className={styles.dayFocusBody}>
      <div ref={setNodeRef} className={`${styles.dayFocusSquare} ${isOver ? styles.dropOver : ""}`}>
        <div className={styles.dayLabel}>{weekdays[date.getDay()]}<strong>{date.getDate()}</strong></div>
        <DayTiles ideas={ideas} />
      </div>
      <div className={styles.dayFocusPanel}>
        <h2>{weekdays[date.getDay()]}, {months[date.getMonth()]} {date.getDate()}</h2>
        <p className={styles.dayFocusMeta}>{placed.length ? `${placed.length} planned${mixText}${checks ? ` · ${checksDone}/${checks} done` : ""}` : "Nothing planned yet"}</p>
        {placed.length ? <div className={styles.dayFocusList} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(88px, 1fr))` }}>
          {placed.map((idea, index) => {
            const category = categories.find(item => item.id === idea.platform);
            const done = idea.checklist.filter(task => task.done).length;
            const total = idea.checklist.length;
            return <button key={idea.id} type="button" className={styles.dayFocusItem} data-platform={idea.platform} style={{ gridColumn: (index % columns) + 1, gridRow: Math.floor(index / columns) + 1 }} onClick={() => onOpenIdea(idea)}>
              <span className={styles.dayFocusSwatch} data-platform={idea.platform} />
              <span className={styles.dayFocusCopy}>
                <strong>{idea.title}</strong>
                <em>{category?.name}{total ? ` · ${done}/${total}` : ""}</em>
                {total ? <span className={styles.dayFocusMeter}><span style={{ width: `${Math.round((done / total) * 100)}%` }} /></span> : null}
              </span>
            </button>;
          })}
        </div> : null}
      </div>
    </div>
  </div>;
}
function IdeaCard({ idea, busy, open, update, remove }: { idea: SocialIdea; busy: boolean; open: () => void; update: (patch: Partial<SocialIdeaInput>) => void; remove: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: idea.id, disabled: busy });
  const [confirm, setConfirm] = useState<"delete" | "done" | null>(null);
  return <article ref={setNodeRef} className={styles.card} style={{ opacity: isDragging ? .35 : 1 }}>
    <div className={styles.cardTop}><button className={styles.dragHandle} {...attributes} {...listeners} disabled={busy} aria-label={`Drag ${idea.title} onto the timeline`}><GripVertical size={18} />{idea.plannedDate ? monthDay(idea.plannedDate) : "Drag to plan"}</button><button className={styles.iconButton} disabled={busy} aria-label={`Delete ${idea.title}`} onClick={() => setConfirm("delete")}><Trash2 size={15} /></button></div>
    <button className={styles.cardContent} onClick={open}><h3>{idea.title}</h3></button>
    <ul className={styles.checklist}>{idea.checklist.map(task => <li key={task.id}><label data-done={task.done}><input type="checkbox" checked={task.done} disabled={busy} onChange={e => update({ checklist: idea.checklist.map(item => item.id === task.id ? { ...item, done: e.target.checked } : item) })} /><span>{task.text}</span></label></li>)}</ul>
    {!idea.checklist.length && <button className={styles.addTaskLink} onClick={open}>+ Add the first task</button>}
    {confirm === "delete" && <div className={styles.deleteConfirm}><span>Delete this idea?</span><button disabled={busy} onClick={remove}>Delete</button><button onClick={() => setConfirm(null)}>Keep</button></div>}
    <div className={styles.cardFooter}>{confirm === "done" ? <div className={styles.deleteConfirm}><span>Remove this idea?</span><button disabled={busy} onClick={remove}>Remove</button><button onClick={() => setConfirm(null)}>Keep</button></div> : <button type="button" className={styles.doneButton} disabled={busy} onClick={() => setConfirm("done")}><Check size={14} />Done</button>}</div>
  </article>;
}

export default function SocialBoard() {
  const [ideas, setIdeas] = useState<SocialIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<{ idea: SocialIdea | null; platform: Platform } | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [start, setStart] = useState(() => dateKey(new Date()));
  const [dragging, setDragging] = useState<string | null>(null);
  const [focused, setFocused] = useState<Platform | null>(null);
  const [boardPage, setBoardPage] = useState<BoardPage>("social");
  const [showSocials, setShowSocials] = useState(true);
  const [showLife, setShowLife] = useState(true);
  const [showVtubing, setShowVtubing] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor));
  async function load() { setLoading(true); setError(""); try { setIdeas(await request<SocialIdea[]>("/api/admin/social")); } catch (error) { setError((error as Error).message); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    const stored = localStorage.getItem(pageKey);
    if (stored && pages.includes(stored as BoardPage)) setBoardPage(stored as BoardPage);
  }, []);
  function saved(idea: SocialIdea) { setIdeas(items => items.some(item => item.id === idea.id) ? items.map(item => item.id === idea.id ? idea : item) : [idea, ...items]); }
  function open(idea: SocialIdea) { if (!lock.current) setEditor({ idea, platform: idea.platform }); }
  function showPage(page: BoardPage) { setBoardPage(page); setFocused(null); localStorage.setItem(pageKey, page); }
  function neighbor(offset: number) { return pages[pages.indexOf(boardPage) + offset]; }
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || dragging || editor) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true'], dialog")) return;
      if (selectedDay) {
        if (event.key === "Escape") { event.preventDefault(); setSelectedDay(null); }
        return;
      }
      const nextPage = neighbor(1);
      const previousPage = neighbor(-1);
      if (event.key === "ArrowRight" && nextPage) { event.preventDefault(); showPage(nextPage); }
      if (event.key === "ArrowLeft" && previousPage) { event.preventDefault(); showPage(previousPage); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [boardPage, dragging, editor, selectedDay]);
  async function update(idea: SocialIdea, patch: Partial<SocialIdeaInput>) {
    if (lock.current) return; lock.current = true; setBusy(true); setError("");
    if ("plannedDate" in patch) setIdeas(items => items.map(item => item.id === idea.id ? { ...item, plannedDate: patch.plannedDate ?? null, placedAt: patch.plannedDate ? new Date().toISOString() : null } : item));
    try { saved(await request<SocialIdea>(`/api/admin/social/${idea.id}`, { method: "PATCH", body: JSON.stringify(patch) })); }
    catch (error) {
      setError((error as Error).message);
      if ("plannedDate" in patch) setIdeas(items => items.map(item => item.id === idea.id ? idea : item));
    } finally { lock.current = false; setBusy(false); }
  }
  async function remove(idea: SocialIdea) {
    if (lock.current) return; lock.current = true; setBusy(true); setError("");
    try { await request(`/api/admin/social/${idea.id}`, { method: "DELETE" }); setIdeas(items => items.filter(item => item.id !== idea.id)); setEditor(null); }
    catch (error) { throw error; } finally { lock.current = false; setBusy(false); }
  }
  function dropped(event: DragEndEvent) { setDragging(null); const idea = ideas.find(item => item.id === event.active.id); if (idea && event.over && idea.plannedDate !== event.over.id) void update(idea, { plannedDate: String(event.over.id) }); }
  const visible = ideas.filter(idea => `${idea.title} ${idea.notes} ${idea.checklist.map(task => task.text).join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const pageCategories = focused ? categories.filter(category => category.id === focused) : catalog[boardPage];
  const pageCount = visible.filter(idea => catalog[boardPage].some(category => category.id === idea.platform)).length;
  const lifePage = boardPage === "life";
  const previous = neighbor(-1);
  const next = neighbor(1);
  const timelineIdeas = ideas.filter(idea => isLifePlatform(idea.platform) ? showLife : isVtubePlatform(idea.platform) ? showVtubing : showSocials);
  return <section className={styles.board}>
    <header className={styles.header}><div><p className={styles.eyebrow}><span /> YOUR CREATIVE SPACE</p><h1>Social studio<span>.</span></h1><p className={styles.subtitle}>Make room for your next good idea.</p></div><button className={styles.primary} disabled={loading || busy} onClick={() => setEditor({ idea: null, platform: pageStart[boardPage] })}><Plus size={19} />{lifePage ? "New task" : "New idea"}</button></header>
    {error && <div className={styles.error} role="alert">{error}<button onClick={load}>Reload</button></div>}
    <DndContext sensors={sensors} onDragStart={event => setDragging(String(event.active.id))} onDragCancel={() => setDragging(null)} onDragEnd={dropped}>
      <section className={styles.timeline} aria-label="Release timeline">{selectedDay ? <DayFocus date={dayAt(selectedDay, 0)} ideas={timelineIdeas.filter(idea => idea.plannedDate === selectedDay)} disabled={loading || busy} onBack={() => setSelectedDay(null)} onOpenIdea={open} /> : <>
        <div className={styles.timelineHeading}><div><h2>Your release timeline</h2></div><div className={styles.timelineControls}><div className={styles.timelineFilters}><button type="button" className={styles.filterToggle} aria-pressed={showSocials} onClick={() => setShowSocials(on => !on)}>Socials</button><button type="button" className={styles.filterToggle} aria-pressed={showLife} onClick={() => setShowLife(on => !on)}>Life</button><button type="button" className={styles.filterToggle} aria-pressed={showVtubing} onClick={() => setShowVtubing(on => !on)}>VTubing</button></div><div className={styles.timelineNav}><button className={styles.iconButton} aria-label="Previous two weeks" onClick={() => setStart(dateKey(dayAt(start, -14)))}><ChevronLeft size={18} /></button><button className={styles.secondary} onClick={() => setStart(dateKey(new Date()))}>Today</button><button className={styles.iconButton} aria-label="Next two weeks" onClick={() => setStart(dateKey(dayAt(start, 14)))}><ChevronRight size={18} /></button></div></div></div>
        <div className={styles.timelineGrid}>{Array.from({ length: 14 }, (_, index) => { const date = dayAt(start, index); const key = dateKey(date); return <TimelineDay key={key} date={date} ideas={timelineIdeas.filter(idea => idea.plannedDate === key)} disabled={loading || busy} onOpen={() => setSelectedDay(key)} />; })}</div>
      </>}</section>
      <div className={styles.toolbar}><span>{pageCount} {lifePage ? "tasks" : "ideas"}</span><label className={styles.search}><Search size={17} /><input aria-label="Search ideas" placeholder={lifePage ? "Find a task…" : "Find an idea…"} value={query} onChange={e => setQuery(e.target.value)} /></label></div>
      <div className={styles.pager}>
        {previous && <button type="button" className={styles.pageArrow} aria-label={`Show ${previous}`} onClick={() => showPage(previous)}><ChevronLeft size={22} /></button>}
        <div className={styles.columns} data-focused={focused || undefined} aria-busy={loading || busy}>{pageCategories.map(({ id, name, caption, Icon }) => { const items = visible.filter(idea => idea.platform === id); const lifeColumn = isLifePlatform(id); return <section key={id} className={styles.column} data-platform={id}>
          <header className={styles.columnHeader}>
            <button type="button" className={styles.focusCategory} onClick={() => setFocused(focused === id ? null : id)} aria-pressed={focused === id} aria-label={focused === id ? `Show all categories` : `Show only ${name}`}>
              <span className={styles.platformIcon}><Icon size={21} /></span>
              <div><h2>{name}<span>{items.length}</span></h2><p>{caption}</p></div>
            </button>
            <div className={styles.columnActions}>
              <button className={styles.iconButton} disabled={loading || busy} aria-label={`Add ${name} ${lifeColumn ? "task" : "idea"}`} onClick={() => setEditor({ idea: null, platform: id })}><Plus size={19} /></button>
            </div>
          </header>
          <div className={styles.cards}>{loading ? (focused ? [0, 1, 2, 3, 4, 5] : [0, 1]).map(n => <div key={n} className={styles.skeleton} />) : items.map(idea => <IdeaCard key={idea.id} idea={idea} busy={busy} open={() => open(idea)} update={patch => void update(idea, patch)} remove={() => { void remove(idea).catch(error => setError((error as Error).message)); }} />)}{!loading && !items.length && <div className={styles.empty}><Icon size={30} /><p>{query ? "No matching items" : lifeColumn ? "Room for your next task" : "Room for your next idea"}</p></div>}{!loading && <button className={styles.addCard} disabled={busy} onClick={() => setEditor({ idea: null, platform: id })}><Plus size={16} />{lifeColumn ? "Add a task" : "Add an idea"}</button>}</div>
        </section>; })}</div>
        {next && <button type="button" className={styles.pageArrow} aria-label={`Show ${next}`} onClick={() => showPage(next)}><ChevronRight size={22} /></button>}
      </div>
      <DragOverlay dropAnimation={null}>{dragging && <div className={styles.dragPreview}>{ideas.find(idea => idea.id === dragging)?.title}</div>}</DragOverlay>
    </DndContext>
    {editor && <IdeaEditor idea={editor.idea} platform={editor.platform} onClose={() => setEditor(null)} onDelete={async () => { if (editor.idea) await remove(editor.idea); }} onSaved={idea => { saved(idea); setEditor(null); }} />}
  </section>;
}
