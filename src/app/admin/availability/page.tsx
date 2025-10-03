// src/app/admin/availability/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

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
  const [uniformFullDay, setUniformFullDay] = useState(false);

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

      // seed uniform fields from Monday (or first)
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
    // Only save the currently active editor.
    // We also include the mode so the server can branch if needed.
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

    const res = await fetch(`/api/admin/availability/rules?mode=${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, rules: toSend }),
    });

    if (!res.ok) {
      const txt = await res.text();
      setLog(`Failed to save ${mode} rules: ${txt}`);
      return;
    }

    setLog(`Weekly rules saved (${mode}).`);
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
      setLog(`Failed to save exception: ${txt}`);
      return;
    }

    const e = await fetch("/api/admin/availability/exceptions").then((r) =>
      r.json()
    );
    setExceptions(e as Exception[]);
    setLog("Exception saved.");
  }

  async function deleteException(id: string) {
    const res = await fetch(`/api/admin/availability/exceptions?id=${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const txt = await res.text();
      setLog(`Failed to delete: ${txt}`);
      return;
    }
    setExceptions((prev) => prev.filter((x) => x.id !== id));
    setLog("Exception deleted.");
  }

  async function regenerateSlots() {
    const res = await fetch("/api/admin/slots/recompute", { method: "POST" });
    if (!res.ok) {
      const txt = await res.text();
      setLog(`Recompute failed: ${txt}`);
      return;
    }
    const data = await res.json();
    setLog(`Recomputed. Deleted: ${data.deleted}, Created: ${data.created}`);
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
      <main className="relative min-h-screen text-white overflow-x-clip">
        {/* BG LAYERS */}
        <div
          aria-hidden
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 22% 18%, rgba(0,130,255,0.28), transparent 58%)," +
              "radial-gradient(circle at 78% 32%, rgba(255,100,30,0.24), transparent 58%)," +
              "radial-gradient(circle at 25% 82%, rgba(0,130,255,0.20), transparent 58%)," +
              "radial-gradient(circle at 80% 75%, rgba(255,100,30,0.18), transparent 58%)",
          }}
        />
        <div
          aria-hidden
          className="fixed inset-0 z-0 opacity-25 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: "url('/images/coaching/texture.png')",
            backgroundRepeat: "repeat",
          }}
        />
        <div className="relative z-10 grid place-items-center min-h-screen">
          <div className="text-sm text-white/80">Loading…</div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen text-white overflow-x-clip">
      {/* BG LAYERS — match students/bookings */}
      <div
        aria-hidden
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 22% 18%, rgba(0,130,255,0.28), transparent 58%)," +
            "radial-gradient(circle at 78% 32%, rgba(255,100,30,0.24), transparent 58%)," +
            "radial-gradient(circle at 25% 82%, rgba(0,130,255,0.20), transparent 58%)," +
            "radial-gradient(circle at 80% 75%, rgba(255,100,30,0.18), transparent 58%)",
        }}
      />
      <div
        aria-hidden
        className="fixed inset-0 z-0 opacity-25 mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: "url('/images/coaching/texture.png')",
          backgroundRepeat: "repeat",
        }}
      />

      {/* CONTENT WRAPPER — 5xl + 24px padding */}
      <div className="relative z-10 pb-20">
        <div className="mx-auto w-full max-w-5xl px-6 space-y-6">
          <div className="h-1" />

          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-semibold">Availability</h1>
            <div className="text-sm text-white/70">
              Times shown in <span className="text-white/90 font-medium">{prettyTZ}</span>
            </div>
          </div>

          {/* Weekly Rules */}
          <section className="rounded-2xl p-6 bg-zinc-900/70 ring-1 ring-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Weekly Rules</h2>
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="mode"
                    value="individual"
                    checked={mode === "individual"}
                    onChange={() => setMode("individual")}
                  />
                  Edit per weekday
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="mode"
                    value="uniform"
                    checked={mode === "uniform"}
                    onChange={() => setMode("uniform")}
                  />
                  Same for all days
                </label>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* INDIVIDUAL */}
              <div
                className={`rounded-xl p-4 ring-1 ${
                  mode === "individual" ? "ring-white/20" : "ring-white/10 opacity-70"
                }`}
              >
                <h3 className="font-medium mb-3">Per-day editor</h3>
                <div className="grid gap-3">
                  {weekdays.map((d, i) => {
                    const rule = rules.find((r) => r.weekday === i)!;
                    const ymd = getAnchorYMDForWeekday(i);
                    return (
                      <div key={i} className="flex gap-3 items-center">
                        <span className="w-10 text-white/80">{d}</span>
                        <input
                          type="time"
                          value={utcMinToLocalHHMM(ymd, rule.openMinute)}
                          onChange={(e) => {
                            const copy = [...rules];
                            const idx = copy.findIndex((r) => r.weekday === i);
                            copy[idx] = {
                              ...copy[idx],
                              openMinute: localHHMMtoUtcMin(ymd, e.target.value),
                            };
                            setRules(copy);
                          }}
                          disabled={mode !== "individual"}
                          className="bg-black/30 ring-1 ring-white/15 rounded px-2 py-1 disabled:opacity-50"
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
                              closeMinute: localHHMMtoUtcMin(ymd, e.target.value),
                            };
                            setRules(copy);
                          }}
                          disabled={mode !== "individual"}
                          className="bg-black/30 ring-1 ring-white/15 rounded px-2 py-1 disabled:opacity-50"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* UNIFORM */}
              <div
                className={`rounded-xl p-4 ring-1 ${
                  mode === "uniform" ? "ring-white/20" : "ring-white/10 opacity-70"
                }`}
              >
                <h3 className="font-medium mb-3">Uniform editor</h3>
                <div className="flex flex-wrap gap-3 items-center">
                  <span className="w-28 text-white/80">All weekdays</span>
                  <input
                    type="time"
                    value={uniformOpen}
                    onChange={(e) => setUniformOpen(e.target.value)}
                    disabled={mode !== "uniform"}
                    className="bg-black/30 ring-1 ring-white/15 rounded px-2 py-1 disabled:opacity-50"
                  />
                  <span>–</span>
                  <input
                    type="time"
                    value={uniformClose}
                    onChange={(e) => setUniformClose(e.target.value)}
                    disabled={mode !== "uniform"}
                    className="bg-black/30 ring-1 ring-white/15 rounded px-2 py-1 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={saveRules}
              className="mt-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 ring-1 ring-white/10 text-sm"
            >
              {mode === "uniform"
                ? "Save Rules (Uniform)"
                : "Save Rules (Per-day)"}
            </button>
          </section>

          {/* Exceptions */}
          <section className="rounded-2xl p-6 bg-zinc-900/70 ring-1 ring-white/10 space-y-4">
            <h2 className="text-base font-semibold">Exceptions</h2>

            <div className="space-y-2">
              {exceptions.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between bg-black/20 ring-1 ring-white/10 px-3 py-2 rounded-lg"
                >
                  <span className="text-sm">
                    {formatLocalDate(ex.date)} —{" "}
                    {ex.blocked
                      ? "Blocked all day"
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
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 ring-1 ring-white/10 text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-2 flex flex-wrap gap-3 items-center">
              <input
                type="date"
                value={exDate}
                onChange={(e) => setExDate(e.target.value)}
                className="bg-black/30 ring-1 ring-white/15 rounded px-2 py-1"
              />
              {!exBlocked && (
                <>
                  <input
                    type="time"
                    value={exOpen}
                    onChange={(e) => setExOpen(e.target.value)}
                    className="bg-black/30 ring-1 ring-white/15 rounded px-2 py-1"
                  />
                  <input
                    type="time"
                    value={exClose}
                    onChange={(e) => setExClose(e.target.value)}
                    className="bg-black/30 ring-1 ring-white/15 rounded px-2 py-1"
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
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 ring-1 ring-white/10 text-sm disabled:opacity-50"
              >
                Add Exception
              </button>
            </div>
          </section>

          {/* Maintenance */}
          <section className="rounded-2xl p-6 bg-zinc-900/70 ring-1 ring-white/10 space-y-3">
            <h2 className="text-base font-semibold">Maintenance</h2>
            <button
              onClick={regenerateSlots}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 ring-1 ring-white/10 text-sm"
            >
              Recompute Future Slots
            </button>
          </section>

          {log && (
            <pre className="bg-black/30 rounded-lg p-3 text-sm text-white/80">{log}</pre>
          )}
        </div>
      </div>
    </main>
  );
}
