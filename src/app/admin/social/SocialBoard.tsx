"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, Check, ExternalLink, LoaderCircle, Plus, Search, Trash2, X } from "lucide-react";
import { FaTiktok, FaXTwitter, FaRedditAlien } from "react-icons/fa6";
import type { SocialIdea, SocialIdeaInput } from "@/lib/socialIdeas";
import styles from "./social.module.css";

const platforms = [
  { id: "tiktok", name: "TikTok", caption: "The next good take", Icon: FaTiktok },
  { id: "twitter", name: "X / Twitter", caption: "Thoughts worth sharing", Icon: FaXTwitter },
  { id: "reddit", name: "Reddit", caption: "Start a conversation", Icon: FaRedditAlien },
] as const;
const statuses = { idea: "Idea", making: "In progress", ready: "Ready", posted: "Posted" } as const;
type Platform = SocialIdeaInput["platform"];
type Filter = "active" | "due" | "posted";

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json" }, cache: "no-store" });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(response.status === 401 ? "Your session expired. Sign in again." : body.error || "Something went wrong. Try again.");
  }
  return response.status === 204 ? undefined as T : response.json();
}

function IdeaEditor({ idea, platform, onClose, onSaved }: {
  idea: SocialIdea | null; platform: Platform; onClose: () => void; onSaved: (idea: SocialIdea) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<SocialIdeaInput>(idea ?? { title: "", notes: "", platform, status: "idea", dueDate: null, reference: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { dialog.current?.showModal(); }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (saving || !draft.title.trim()) return;
    setSaving(true); setError("");
    try {
      const { title, notes, platform, status, dueDate, reference } = draft;
      const saved = await request<SocialIdea>(`/api/admin/social${idea ? `/${idea.id}` : ""}`, {
        method: idea ? "PATCH" : "POST", body: JSON.stringify({ title, notes, platform, status, dueDate, reference }),
      });
      onSaved(saved);
    } catch (error) { setError((error as Error).message); setSaving(false); }
  }

  return <dialog ref={dialog} aria-labelledby="social-idea-editor-title" className={styles.dialog} onCancel={(event) => { event.preventDefault(); if (!saving) onClose(); }}>
    <form onSubmit={save}>
      <div className={styles.dialogHeading}><h2 id="social-idea-editor-title">{idea ? "Edit idea" : "A new idea"}</h2><button type="button" aria-label="Close editor" disabled={saving} onClick={onClose} className={styles.iconButton}><X size={20} /></button></div>
      <div className={styles.platformPicker} aria-label="Platform">
        {platforms.map(({ id, name, Icon }) => <button key={id} type="button" aria-pressed={draft.platform === id} onClick={() => setDraft({ ...draft, platform: id })} data-platform={id} className={draft.platform === id ? styles.platformSelected : ""}><Icon />{name}</button>)}
      </div>
      <label className={styles.field}>Idea<input autoFocus required maxLength={180} placeholder="What's the idea?" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
      <label className={styles.field}>Notes<textarea aria-label="Notes" rows={5} maxLength={5000} placeholder="The hook, the rough draft, the details…" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></label>
      <div className={styles.fieldRow}>
        <label className={styles.field}>Progress<select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as SocialIdeaInput["status"] })}>{Object.entries(statuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className={styles.field}>Remind me on<input type="date" value={draft.dueDate ?? ""} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value || null })} /></label>
      </div>
      <label className={styles.field}>Reference link<input type="url" maxLength={2000} placeholder="https://…" value={draft.reference} onChange={(e) => setDraft({ ...draft, reference: e.target.value })} /></label>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.dialogFooter}><button type="button" className={styles.secondary} disabled={saving} onClick={onClose}>Cancel</button><button className={styles.primary} disabled={saving || !draft.title.trim()}>{saving ? <LoaderCircle size={17} className={styles.spin} /> : <Check size={17} />}{saving ? "Saving…" : "Save idea"}</button></div>
    </form>
  </dialog>;
}

export default function SocialBoard() {
  const [ideas, setIdeas] = useState<SocialIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("active");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<{ idea: SocialIdea | null; platform: Platform } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [today, setToday] = useState(todayKey);

  async function load() {
    setLoading(true); setError("");
    try { setIdeas(await request<SocialIdea[]>("/api/admin/social")); }
    catch (error) { setError((error as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); const timer = window.setInterval(() => setToday(todayKey()), 60_000); return () => window.clearInterval(timer); }, []);

  async function changeStatus(idea: SocialIdea, status: SocialIdeaInput["status"]) {
    setBusy(idea.id); setError("");
    try {
      const updated = await request<SocialIdea>(`/api/admin/social/${idea.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setIdeas((items) => items.map((item) => item.id === updated.id ? updated : item));
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(null); }
  }

  async function remove(id: string) {
    setBusy(id); setError("");
    try { await request(`/api/admin/social/${id}`, { method: "DELETE" }); setIdeas((items) => items.filter((item) => item.id !== id)); setPendingDelete(null); }
    catch (error) { setError((error as Error).message); }
    finally { setBusy(null); }
  }

  const active = ideas.filter((idea) => idea.status !== "posted");
  const due = active.filter((idea) => idea.dueDate && idea.dueDate <= today);
  const visible = ideas.filter((idea) => {
    const matchesFilter = filter === "posted" ? idea.status === "posted" : filter === "due" ? idea.status !== "posted" && idea.dueDate && idea.dueDate <= today : idea.status !== "posted";
    return matchesFilter && `${idea.title} ${idea.notes}`.toLowerCase().includes(query.toLowerCase());
  }).sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") || b.createdAt.localeCompare(a.createdAt));

  return <section className={styles.board}>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}><span /> YOUR CREATIVE SPACE</p><h1>Social studio<span>.</span></h1><p className={styles.subtitle}>Good ideas, all in one place.</p></div>
      <button className={styles.primary} disabled={loading} onClick={() => setEditor({ idea: null, platform: "tiktok" })}><Plus size={19} />New idea</button>
    </header>

    <div className={styles.toolbar}>
      <div className={styles.filters} aria-label="Filter ideas">
        {([ ["active", "On the board", active.length], ["due", "Due", due.length], ["posted", "Posted", ideas.length - active.length] ] as const).map(([key, label, count]) => <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)} className={filter === key ? styles.selectedFilter : ""}>{label}<span>{count}</span></button>)}
      </div>
      <label className={styles.search}><Search size={17} /><input aria-label="Search ideas" placeholder="Find an idea…" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
    </div>

    {error && <div className={styles.error} role="alert">{error}<button onClick={load}>Retry</button></div>}
    <div className={styles.columns} aria-busy={loading}>
      {platforms.map(({ id, name, caption, Icon }) => {
        const items = visible.filter((idea) => idea.platform === id);
        return <section key={id} className={styles.column} data-platform={id}>
          <header className={styles.columnHeader}><span className={styles.platformIcon}><Icon size={21} /></span><div><h2>{name}<span>{items.length}</span></h2><p>{caption}</p></div><button className={styles.iconButton} disabled={loading} aria-label={`Add ${name} idea`} onClick={() => setEditor({ idea: null, platform: id })}><Plus size={19} /></button></header>
          <div className={styles.cards}>
            {loading ? [0, 1].map((n) => <div key={n} className={styles.skeleton} />) : items.map((idea) => {
              const overdue = idea.status !== "posted" && idea.dueDate && idea.dueDate < today;
              return <article className={styles.card} key={idea.id}>
                <div className={styles.cardTop}><span className={styles.status} data-status={idea.status}><span />{statuses[idea.status]}</span><button className={styles.iconButton} disabled={busy !== null} aria-label={`Delete ${idea.title}`} onClick={() => setPendingDelete(idea.id)}><Trash2 size={15} /></button></div>
                <button className={styles.cardContent} onClick={() => setEditor({ idea, platform: id })}><h3>{idea.title}</h3>{idea.notes && <p>{idea.notes}</p>}</button>
                <div className={styles.cardMeta}>{idea.dueDate && <span className={overdue ? styles.overdue : ""}><CalendarDays size={13} />{idea.dueDate === today ? "Today" : new Date(`${idea.dueDate}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", ...(idea.dueDate.slice(0, 4) !== today.slice(0, 4) ? { year: "numeric" as const } : {}) })}{overdue ? " · overdue" : ""}</span>}{idea.reference && <a href={idea.reference} target="_blank" rel="noopener noreferrer" aria-label={`Reference for ${idea.title}`}><ExternalLink size={13} />Reference</a>}</div>
                {pendingDelete === idea.id ? <div className={styles.deleteConfirm}><span>Delete this idea?</span><button disabled={busy !== null} onClick={() => remove(idea.id)}>Delete</button><button disabled={busy !== null} onClick={() => setPendingDelete(null)}>Keep</button></div> : <div className={styles.cardFooter}><select aria-label={`Progress for ${idea.title}`} disabled={busy !== null} value={idea.status} onChange={(e) => changeStatus(idea, e.target.value as SocialIdeaInput["status"])}>{Object.entries(statuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><button disabled={busy !== null} aria-label={idea.status === "posted" ? `Reopen ${idea.title}` : `Mark ${idea.title} as posted`} onClick={() => changeStatus(idea, idea.status === "posted" ? "idea" : "posted")} className={styles.complete}>{busy === idea.id ? <LoaderCircle size={15} className={styles.spin} /> : <Check size={15} />}{idea.status === "posted" ? "Reopen" : "Posted"}</button></div>}
              </article>;
            })}
            {!loading && items.length === 0 && <div className={styles.empty}><Icon size={30} /><p>{query ? "No matching ideas" : filter === "posted" ? "Nothing posted yet" : filter === "due" ? "All clear" : "Room for your next idea"}</p></div>}
            {!loading && filter === "active" && <button className={styles.addCard} onClick={() => setEditor({ idea: null, platform: id })}><Plus size={16} />Add an idea</button>}
          </div>
        </section>;
      })}
    </div>
    {editor && <IdeaEditor idea={editor.idea} platform={editor.platform} onClose={() => setEditor(null)} onSaved={(saved) => { setIdeas((items) => items.some((item) => item.id === saved.id) ? items.map((item) => item.id === saved.id ? saved : item) : [saved, ...items]); setEditor(null); setQuery(""); setFilter(saved.status === "posted" ? "posted" : "active"); }} />}
  </section>;
}

