"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

type Rule = { weekday: number; openMinute: number; closeMinute: number };
type Exception = {
  id: string;
  date: string; // ISO date (UTC midnight)
  openMinute?: number;
  closeMinute?: number;
  blocked: boolean;
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// --- time helpers ---
function minToHHMM(m: number) {
  const h = Math.floor(m / 60).toString().padStart(2, "0");
  const mm = (m % 60).toString().padStart(2, "0");
  return `${h}:${mm}`;
}
function hhmmToMin(str: string) {
  const [h, m] = str.split(":").map(Number);
  return h * 60 + m;
}
const clampMin = (n: number) => Math.max(0, Math.min(1440, n));

// NEW: for <input type="time">, never show 24:00 (invalid). Use 23:59.
function minToInputHHMM(m: number) {
  if (m >= 1440) return "23:59";
  return minToHHMM(m);
}

// defaults if a weekday had no rule in DB yet
const DEFAULT_OPEN = 13 * 60; // 13:00
const DEFAULT_CLOSE = 24 * 60; // 24:00

export default function AdminSlotsPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [loading, setLoading] = useState(true);
  const [log, setLog] = useState("");

  // new exception form
  const [exDate, setExDate] = useState("");
  const [exOpen, setExOpen] = useState("13:00");
  const [exClose, setExClose] = useState("15:00");
  const [exBlocked, setExBlocked] = useState(false);

  // Load rules + exceptions
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [r, e] = await Promise.all([
        fetch("/api/admin/availability/rules").then((r) => r.json()),
        fetch("/api/admin/availability/exceptions").then((r) => r.json()),
      ]);

      // r is an array of {weekday, openMinute, closeMinute} but may be missing some weekdays
      const byDay = new Map<number, Rule>();
      (r as Rule[]).forEach((row) => byDay.set(row.weekday, row));

      // ensure 7 entries, fill with default if missing
      const normalized: Rule[] = Array.from({ length: 7 }, (_, weekday) => {
        const u = byDay.get(weekday);
        return {
          weekday,
          openMinute: clampMin(u?.openMinute ?? DEFAULT_OPEN),
          closeMinute: clampMin(u?.closeMinute ?? DEFAULT_CLOSE),
        };
      });

      setRules(normalized);
      setExceptions(e as Exception[]);
      setLoading(false);
    })();
  }, []);

  // Save rules: transform to the POST schema your server expects (7 HH:MM strings, Sun→Sat)
  async function saveRules() {
    // order: Sun..Sat
const ordered = [...rules].sort((a, b) => a.weekday - b.weekday);
const body = {
  rules: ordered.map((r) => {
    const open = minToHHMM(clampMin(r.openMinute));
    // if UI showed 23:59 because it was 24:00, restore "24:00" for API
    const closeWasFullDay = r.closeMinute >= 1440;
    const close = closeWasFullDay ? "24:00" : minToHHMM(clampMin(r.closeMinute));
    return { open, close };
  }),
};


    const res = await fetch("/api/admin/availability/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      setLog(`❌ Failed to save rules: ${txt}`);
      return;
    }

    setLog("✨ Weekly rules saved.");
  }

  // Create/Update exception
  async function addException() {
    const body = {
      date: exDate, // "YYYY-MM-DD"
      open: exBlocked ? undefined : exOpen,
      close: exBlocked ? undefined : exClose,
      blocked: exBlocked,
    };

    const res = await fetch("/api/admin/availability/exceptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      setLog(`❌ Failed to save exception: ${txt}`);
      return;
    }

    // refresh list
    const e = await fetch("/api/admin/availability/exceptions").then((r) => r.json());
    setExceptions(e as Exception[]);
    setLog("🪄 Exception saved.");
  }

  // Delete exception (your DELETE route accepts ?id=)
  async function deleteException(id: string) {
    const res = await fetch(`/api/admin/availability/exceptions?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      const txt = await res.text();
      setLog(`❌ Failed to delete: ${txt}`);
      return;
    }
    setExceptions((prev) => prev.filter((x) => x.id !== id));
    setLog("💨 Exception deleted.");
  }

  // Regenerate future slots from current rules/exceptions (same logic as nightly cron)
  async function regenerateSlots() {
    const res = await fetch("/api/admin/slots/recompute", { method: "POST" });
    if (!res.ok) {
      const txt = await res.text();
      setLog(`❌ Re-summon failed: ${txt}`);
      return;
    }
    const data = await res.json();
    setLog(`🔮 Re-summoned future slots. Deleted: ${data.deleted}, Created: ${data.created}`);
  }
function formatLocalDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
  const prettyTZ = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    []
  );

  if (loading) {
    return (
      <div className="grid place-items-center min-h-screen text-white">
        <div className="text-sm opacity-80">Loading your spellbook…</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-black to-indigo-950 text-white">
      <div className="w-full max-w-3xl space-y-10 p-8 bg-black/40 rounded-3xl border border-purple-500/30 shadow-[0_0_30px_rgba(150,0,255,0.3)]">
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-5xl font-extrabold text-center bg-gradient-to-r from-fuchsia-400 to-cyan-400 bg-clip-text text-transparent"
        >
          🧙 Master Wizard Panel
        </motion.h1>
        <p className="text-center text-purple-300">Times are interpreted in your timezone: <span className="text-purple-100 font-medium">{prettyTZ}</span></p>

        {/* Weekly Rules */}
<section className="relative bg-neutral-900/70 rounded-2xl p-6 shadow-lg overflow-hidden">
  <h2 className="text-2xl font-semibold mb-4">📜 Weekly Rules</h2>
  <div className="grid gap-3">
    {weekdays.map((d, i) => {
      const rule = rules.find((r) => r.weekday === i)!;
      return (
        <div key={i} className="flex gap-3 items-center">
          <span className="w-10">{d}</span>
          {/* Start time (openMinute) */}
          <input
            type="time"
            value={minToInputHHMM(rule.openMinute)}   // ✅ use openMinute
            onChange={(e) => {
              const copy = [...rules];
              const idx = copy.findIndex((r) => r.weekday === i);
              copy[idx] = { ...copy[idx], openMinute: clampMin(hhmmToMin(e.target.value)) }; // ✅ update openMinute
              setRules(copy);
            }}
            className="bg-neutral-800 px-2 py-1 rounded"
          />
          <span>–</span>
          {/* End time (closeMinute) */}
          <input
            type="time"
            value={minToInputHHMM(rule.closeMinute)}  // ✅ use closeMinute
            onChange={(e) => {
              const copy = [...rules];
              const idx = copy.findIndex((r) => r.weekday === i);
              copy[idx] = { ...copy[idx], closeMinute: clampMin(hhmmToMin(e.target.value)) }; // ✅ update closeMinute
              setRules(copy);
            }}
            className="bg-neutral-800 px-2 py-1 rounded"
          />
        </div>
      );
    })}
          </div>
          <button
            onClick={saveRules}
            className="mt-4 px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-400 hover:opacity-90 font-medium shadow-[0_0_10px_rgba(0,255,200,0.5)]"
          >
            Save Rules ✍️
          </button>
        </section>

        {/* Exceptions */}
        <section className="bg-neutral-900/70 rounded-2xl p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">🎩 Exceptions</h2>

          <div className="space-y-2 mb-4">
            {exceptions.map((ex) => (
              <motion.div
                key={ex.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex justify-between items-center bg-neutral-800/70 px-3 py-2 rounded-lg border border-purple-700/40"
              >
                <span>
  {formatLocalDate(ex.date)} —{" "}
  {ex.blocked
    ? "❌ Blocked all day"
    : `${minToHHMM(ex.openMinute ?? 0)}–${minToHHMM(
        ex.closeMinute ?? 24 * 60
      )}`}
</span>
                <button
                  onClick={() => deleteException(ex.id)}
                  className="text-rose-400 hover:text-rose-300"
                >
                  Vanish
                </button>
              </motion.div>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap gap-3 items-center">
            <input
              type="date"
              value={exDate}
              onChange={(e) => setExDate(e.target.value)}
              className="bg-neutral-800 px-2 py-1 rounded"
            />
            {!exBlocked && (
              <>
                <input
                  type="time"
                  value={exOpen}
                  onChange={(e) => setExOpen(e.target.value)}
                  className="bg-neutral-800 px-2 py-1 rounded"
                />
                <input
                  type="time"
                  value={exClose}
                  onChange={(e) => setExClose(e.target.value)}
                  className="bg-neutral-800 px-2 py-1 rounded"
                />
              </>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={exBlocked}
                onChange={(e) => setExBlocked(e.target.checked)}
              />
              Block entire day
            </label>
            <button
              onClick={addException}
              disabled={!exDate}
              className="px-4 py-2 rounded-xl disabled:opacity-40 bg-gradient-to-r from-sky-500 to-purple-500 hover:opacity-90 shadow-[0_0_10px_rgba(100,100,255,0.5)]"
            >
              + Conjure Exception
            </button>
          </div>
        </section>

        {/* Maintenance */}
        <section className="bg-neutral-900/70 rounded-2xl p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">🔥 Spell Maintenance</h2>
          <button
            onClick={regenerateSlots}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-red-500 hover:opacity-90 shadow-[0_0_15px_rgba(255,80,0,0.5)]"
          >
            Re-summon Future Slots
          </button>
        </section>

        {log && (
          <pre className="bg-neutral-900/80 rounded-lg p-3 text-sm text-purple-300">
            {log}
          </pre>
        )}
      </div>
    </div>
  );
}
