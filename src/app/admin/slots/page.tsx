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
const TZ = "Europe/Berlin";

// --- time helpers ---
function minToHHMM(m: number) {
  const h = Math.floor(m / 60).toString().padStart(2, "0");
  const mm = (m % 60).toString().padStart(2, "0");
  return `${h}:${mm}`;
}
const clampMin = (n: number) => Math.max(0, Math.min(1440, n));

function utcMinToLocalHHMM(ymd: string, utcMin: number) {
  const utcMid = new Date(`${ymd}T00:00:00Z`);
  const utcTime = new Date(utcMid.getTime() + utcMin * 60_000);
  return utcTime.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  });
}
function localHHMMtoUtcMin(ymd: string, hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const localMid = new Date(
    new Date(`${ymd}T00:00:00`).toLocaleString("en-US", { timeZone: TZ })
  );
  const localTime = new Date(localMid);
  localTime.setHours(h, m, 0, 0);
  const utcMid = new Date(`${ymd}T00:00:00Z`).getTime();
  return Math.round((localTime.getTime() - utcMid) / 60_000);
}

const DEFAULT_OPEN = 13 * 60;
const DEFAULT_CLOSE = 24 * 60;

function getAnchorYMDForWeekday(weekday: number) {
  const today = new Date();
  const diff = (weekday - today.getDay() + 7) % 7;
  const anchor = new Date(today);
  anchor.setDate(today.getDate() + diff);
  return anchor.toISOString().slice(0, 10);
}

export default function AdminSlotsPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [loading, setLoading] = useState(true);
  const [log, setLog] = useState("");

  // default to uniform mode
  const [mode, setMode] = useState<"individual" | "uniform">("uniform");
  const [uniformOpen, setUniformOpen] = useState("13:00");
  const [uniformClose, setUniformClose] = useState("23:59");
  const [uniformFullDay, setUniformFullDay] = useState(false); // still used internally

  const [exDate, setExDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [exOpen, setExOpen] = useState("13:00");
  const [exClose, setExClose] = useState("15:00");
  const [exBlocked, setExBlocked] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [r, e] = await Promise.all([
        fetch("/api/admin/availability/rules").then((r) => r.json()),
        fetch("/api/admin/availability/exceptions").then((r) => r.json()),
      ]);

      const byDay = new Map<number, Rule>();
      (r as Rule[]).forEach((row) => byDay.set(row.weekday, row));

      const normalized: Rule[] = Array.from({ length: 7 }, (_, weekday) => {
        const u = byDay.get(weekday);
        return {
          weekday,
          openMinute: clampMin(u?.openMinute ?? DEFAULT_OPEN),
          closeMinute: clampMin(u?.closeMinute ?? DEFAULT_CLOSE),
        };
      });

      setRules(normalized);

      const sample = normalized[1] ?? normalized[0];
      const ymd = getAnchorYMDForWeekday(sample.weekday);
      setUniformOpen(utcMinToLocalHHMM(ymd, sample.openMinute));
      setUniformClose(
        sample.closeMinute >= 1440
          ? "23:59"
          : utcMinToLocalHHMM(ymd, sample.closeMinute)
      );
      setUniformFullDay(sample.closeMinute >= 1440);

      setExceptions(e as Exception[]);
      setLoading(false);
    })();
  }, []);

  async function saveRules() {
    let toSend: { open: string; close: string }[];

    if (mode === "uniform") {
      toSend = Array.from({ length: 7 }, (_, weekday) => {
        const ymd = getAnchorYMDForWeekday(weekday);
        const openMinUtc = localHHMMtoUtcMin(ymd, uniformOpen);
        const closeMinUtc = uniformFullDay
          ? 1440
          : localHHMMtoUtcMin(ymd, uniformClose);

        const open = minToHHMM(clampMin(openMinUtc));
        const close =
          uniformFullDay || closeMinUtc >= 1440
            ? "24:00"
            : minToHHMM(clampMin(closeMinUtc));

        return { open, close };
      });
    } else {
      const ordered = [...rules].sort((a, b) => a.weekday - b.weekday);
      toSend = ordered.map((r) => {
        const open = minToHHMM(clampMin(r.openMinute));
        const close =
          r.closeMinute >= 1440 ? "24:00" : minToHHMM(clampMin(r.closeMinute));
        return { open, close };
      });
    }

    const res = await fetch("/api/admin/availability/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rules: toSend }),
    });

    if (!res.ok) {
      const txt = await res.text();
      setLog(`❌ Failed to save rules: ${txt}`);
      return;
    }

    setLog("✨ Weekly rules saved.");
  }

  async function addException() {
    const body = {
      date: exDate,
      blocked: exBlocked,
      open: exBlocked ? undefined : minToHHMM(localHHMMtoUtcMin(exDate, exOpen)),
      close: exBlocked
        ? undefined
        : minToHHMM(localHHMMtoUtcMin(exDate, exClose)),
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

    const e = await fetch("/api/admin/availability/exceptions").then((r) =>
      r.json()
    );
    setExceptions(e as Exception[]);
    setLog("🪄 Exception saved.");
  }

  async function deleteException(id: string) {
    const res = await fetch(`/api/admin/availability/exceptions?id=${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const txt = await res.text();
      setLog(`❌ Failed to delete: ${txt}`);
      return;
    }
    setExceptions((prev) => prev.filter((x) => x.id !== id));
    setLog("💨 Exception deleted.");
  }

  async function regenerateSlots() {
    const res = await fetch("/api/admin/slots/recompute", { method: "POST" });
    if (!res.ok) {
      const txt = await res.text();
      setLog(`❌ Re-summon failed: ${txt}`);
      return;
    }
    const data = await res.json();
    setLog(`🔮 Re-summoned. Deleted: ${data.deleted}, Created: ${data.created}`);
  }

  function formatLocalDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: TZ,
    });
  }

  const prettyTZ = useMemo(() => TZ, []);

  if (loading) {
    return (
      <div className="min-h-screen text-white relative">
        <div className="fixed inset-0 z-0 bg-gradient-to-br from-purple-900 via-black to-indigo-950" />
        <div className="grid place-items-center min-h-screen relative z-10">
          <div className="text-sm opacity-80">Loading your spellbook…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative">
      {/* background gradient always visible */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-purple-900 via-black to-indigo-950" />

      <div className="flex items-center justify-center min-h-screen relative z-10">
        <div className="w-full max-w-5xl space-y-10 p-8 bg-black/40 rounded-3xl border border-purple-500/30 shadow-[0_0_30px_rgba(150,0,255,0.3)]">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-5xl font-extrabold text-center bg-gradient-to-r from-fuchsia-400 to-cyan-400 bg-clip-text text-transparent"
          >
            🧙 Master Wizard Panel
          </motion.h1>
          <p className="text-center text-purple-300">
            Times shown in:{" "}
            <span className="text-purple-100 font-medium">{prettyTZ}</span>
          </p>

          {/* Weekly Rules */}
          <section className="bg-neutral-900/70 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">📜 Weekly Rules</h2>
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    value="individual"
                    checked={mode === "individual"}
                    onChange={() => setMode("individual")}
                  />
                  Edit weekdays individually
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    value="uniform"
                    checked={mode === "uniform"}
                    onChange={() => setMode("uniform")}
                  />
                  One range for all weekdays
                </label>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* INDIVIDUAL */}
              <div
                className={`rounded-xl p-4 border ${
                  mode === "individual"
                    ? "border-purple-400/60"
                    : "border-neutral-700/80 opacity-60"
                }`}
              >
                <h3 className="font-semibold mb-3">Per-day editor</h3>
                <div className="grid gap-3">
                  {weekdays.map((d, i) => {
                    const rule = rules.find((r) => r.weekday === i)!;
                    const ymd = getAnchorYMDForWeekday(i);
                    return (
                      <div key={i} className="flex gap-3 items-center">
                        <span className="w-10">{d}</span>
                        <input
                          type="time"
                          value={utcMinToLocalHHMM(ymd, rule.openMinute)}
                          onChange={(e) => {
                            const copy = [...rules];
                            const idx = copy.findIndex((r) => r.weekday === i);
                            copy[idx] = {
                              ...copy[idx],
                              openMinute: localHHMMtoUtcMin(
                                ymd,
                                e.target.value
                              ),
                            };
                            setRules(copy);
                          }}
                          disabled={mode !== "individual"}
                          className="bg-neutral-800 px-2 py-1 rounded disabled:opacity-50"
                        />
                        <span>–</span>
                        <input
                          type="time"
                          value={utcMinToLocalHHMM(ymd, rule.closeMinute)}
                          onChange={(e) => {
                            const copy = [...rules];
                            const idx = copy.findIndex((r) => r.weekday === i);
                            copy[idx] = {
                              ...copy[idx],
                              closeMinute: localHHMMtoUtcMin(
                                ymd,
                                e.target.value
                              ),
                            };
                            setRules(copy);
                          }}
                          disabled={mode !== "individual"}
                          className="bg-neutral-800 px-2 py-1 rounded disabled:opacity-50"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* UNIFORM */}
              <div
                className={`rounded-xl p-4 border ${
                  mode === "uniform"
                    ? "border-purple-400/60"
                    : "border-neutral-700/80 opacity-60"
                }`}
              >
                <h3 className="font-semibold mb-3">Uniform editor</h3>
                <div className="flex flex-wrap gap-3 items-center">
                  <span className="w-28 opacity-80">All weekdays</span>
                  <input
                    type="time"
                    value={uniformOpen}
                    onChange={(e) => setUniformOpen(e.target.value)}
                    disabled={mode !== "uniform"}
                    className="bg-neutral-800 px-2 py-1 rounded disabled:opacity-50"
                  />
                  <span>–</span>
                  <input
                    type="time"
                    value={uniformClose}
                    onChange={(e) => setUniformClose(e.target.value)}
                    disabled={mode !== "uniform"}
                    className="bg-neutral-800 px-2 py-1 rounded disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={saveRules}
              className="mt-6 px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-400 hover:opacity-90 font-medium shadow-[0_0_10px_rgba(0,255,200,0.5)]"
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
                      : `${utcMinToLocalHHMM(
                          ex.date.slice(0, 10),
                          ex.openMinute ?? 0
                        )}–${utcMinToLocalHHMM(
                          ex.date.slice(0, 10),
                          ex.closeMinute ?? 1440
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
    </div>
  );
}
