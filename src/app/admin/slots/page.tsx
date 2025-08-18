"use client";

import { useMemo, useState } from "react";

function isoDay(d: Date) {
  // YYYY-MM-DD
  return d.toISOString().slice(0, 10);
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export default function AdminSlotsPage() {
  // default: today .. today+7 days
  const [from, setFrom] = useState(() => isoDay(new Date()));
  const [to, setTo] = useState(() => isoDay(addDays(new Date(), 7)));
  const [openHour, setOpenHour] = useState(13);
  const [closeHour, setCloseHour] = useState(24);
  const [stepMin, setStepMin] = useState(15);

  const [log, setLog] = useState<string>("");

  // inclusive from 00:00Z; exclusive to 00:00Z
  const fromISO = useMemo(() => `${from}T00:00:00.000Z`, [from]);
  const toISO = useMemo(() => `${to}T00:00:00.000Z`, [to]);

  async function call(url: string, body: any) {
    setLog("…");
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" }, // no admin header; Basic auth is handled by middleware
      body: JSON.stringify(body),
    });
    const txt = await res.text();
    let json: any = txt;
    try { json = JSON.parse(txt); } catch {}
    setLog(JSON.stringify({ status: res.status, body: json }, null, 2));
    if (!res.ok) throw new Error(typeof json === "object" ? json?.error || "Request failed" : txt);
  }

  return (
    <div className="p-6 space-y-6 text-white">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Admin • Slots</h1>
        <p className="text-white/60 text-sm">
          Protected by Basic auth via <code>middleware.ts</code>. Your browser will prompt for username/password.
        </p>
        <p className="text-white/50 text-xs">
          Times are UTC in the database. Visible timezone here: {Intl.DateTimeFormat().resolvedOptions().timeZone}
        </p>
      </header>

      {/* Range pickers */}
      <section className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-white/70">From (inclusive)</span>
          <input
            type="date"
            className="px-3 py-2 rounded bg-neutral-900 ring-1 ring-white/10 outline-none focus:ring-white/20"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-white/70">To (exclusive)</span>
          <input
            type="date"
            className="px-3 py-2 rounded bg-neutral-900 ring-1 ring-white/10 outline-none focus:ring-white/20"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
      </section>

      {/* Quick picks */}
      <div className="flex flex-wrap gap-2">
        <button
          className="px-3 py-1.5 rounded bg-white/10 ring-1 ring-white/15 hover:bg-white/15"
          onClick={() => { const d = new Date(); setFrom(isoDay(d)); setTo(isoDay(addDays(d, 7))); }}
        >
          Next 7 days
        </button>
        <button
          className="px-3 py-1.5 rounded bg-white/10 ring-1 ring-white/15 hover:bg-white/15"
          onClick={() => { const d = new Date(); setFrom(isoDay(d)); setTo(isoDay(addDays(d, 28))); }}
        >
          Next 28 days
        </button>
        <button
          className="px-3 py-1.5 rounded bg-white/10 ring-1 ring-white/15 hover:bg-white/15"
          onClick={() => { const d = new Date(); setFrom(isoDay(d)); setTo(isoDay(addDays(d, 1))); }}
        >
          Today only
        </button>
      </div>

      {/* Generate */}
      <section className="space-y-3">
        <div className="text-white/80 font-medium">Generate slots</div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2">
            <span className="text-sm text-white/70 w-28">Open hour</span>
            <input
              type="number"
              min={0}
              max={23}
              className="w-24 px-3 py-2 rounded bg-neutral-900 ring-1 ring-white/10"
              value={openHour}
              onChange={(e) => setOpenHour(parseInt(e.target.value || "0", 10))}
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-sm text-white/70 w-28">Close hour</span>
            <input
              type="number"
              min={1}
              max={24}
              className="w-24 px-3 py-2 rounded bg-neutral-900 ring-1 ring-white/10"
              value={closeHour}
              onChange={(e) => setCloseHour(parseInt(e.target.value || "24", 10))}
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-sm text-white/70 w-28">Step (min)</span>
            <input
              type="number"
              min={5}
              max={60}
              step={5}
              className="w-24 px-3 py-2 rounded bg-neutral-900 ring-1 ring-white/10"
              value={stepMin}
              onChange={(e) => setStepMin(parseInt(e.target.value || "15", 10))}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500"
            onClick={() =>
              call("/api/admin/slots/generate", {
                from: fromISO,
                to: toISO,
                openHour,
                closeHour,
                stepMin,
              })
            }
          >
            Generate missing slots
          </button>
        </div>
      </section>

      {/* Bulk actions */}
      <section className="space-y-3">
        <div className="text-white/80 font-medium">Bulk actions</div>
        <div className="flex flex-wrap gap-2">
          <button
            className="px-4 py-2 rounded bg-sky-600 hover:bg-sky-500"
            onClick={() => call("/api/admin/slots/bulk", { action: "markFree", from: fromISO, to: toISO })}
          >
            Mark Free (range)
          </button>
          <button
            className="px-4 py-2 rounded bg-yellow-600 hover:bg-yellow-500"
            onClick={() => call("/api/admin/slots/bulk", { action: "markTaken", from: fromISO, to: toISO })}
          >
            Mark Taken (range)
          </button>
          <button
            className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-500"
            onClick={() => {
              if (confirm("Delete ALL slots in range? This cannot be undone.")) {
                call("/api/admin/slots/bulk", { action: "delete", from: fromISO, to: toISO });
              }
            }}
          >
            Delete (range)
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="px-3 py-2 rounded bg-orange-600 hover:bg-orange-500"
            onClick={() =>
              call("/api/admin/slots/bulk", {
                action: "markTaken",
                from: `${from}T00:00:00.000Z`,
                to: `${from}T23:59:59.999Z`,
              })
            }
          >
            Close selected day
          </button>
          <button
            className="px-3 py-2 rounded bg-orange-700 hover:bg-orange-600"
            onClick={() =>
              call("/api/admin/slots/bulk", {
                action: "markTaken",
                from: `${from}T00:00:00.000Z`,
                to: `${to}T00:00:00.000Z`,
              })
            }
          >
            Close vacation range
          </button>
        </div>
      </section>

      {/* Output */}
      <section>
        <div className="text-white/80 font-medium mb-2">Response</div>
        <pre className="p-3 rounded bg-neutral-900 ring-1 ring-white/10 text-white/90 text-sm overflow-auto">
{log || "No actions yet."}
        </pre>
      </section>
    </div>
  );
}
