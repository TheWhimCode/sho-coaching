"use client";

import { useState } from "react";

export default function AdminSlotsPage() {
  const weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const [rules, setRules] = useState(
    weekdays.map(() => ({ open: "13:00", close: "24:00" }))
  );
  const [exceptionDate, setExceptionDate] = useState("");
  const [exceptionOpen, setExceptionOpen] = useState("13:00");
  const [exceptionClose, setExceptionClose] = useState("24:00");
  const [exceptionBlocked, setExceptionBlocked] = useState(false);
  const [log, setLog] = useState("");

  async function call(url: string, body: any) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const txt = await res.text();
    setLog(txt);
  }

  return (
    <div className="p-6 space-y-6 text-white">
      <h1 className="text-2xl font-semibold">Admin • Availability</h1>

      {/* Rules */}
      <section>
        <h2 className="font-medium mb-2">Weekly Rules</h2>
        <div className="grid gap-2">
          {weekdays.map((d,i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="w-10">{d}</span>
              <input type="time" value={rules[i].open}
                onChange={e => {
                  const copy=[...rules]; copy[i].open=e.target.value; setRules(copy);
                }}
                className="bg-neutral-900 px-2 py-1 rounded" />
              <span>–</span>
              <input type="time" value={rules[i].close}
                onChange={e => {
                  const copy=[...rules]; copy[i].close=e.target.value; setRules(copy);
                }}
                className="bg-neutral-900 px-2 py-1 rounded" />
            </div>
          ))}
        </div>
        <button
          className="mt-3 px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500"
          onClick={() => call("/api/admin/availability/rules", { rules })}
        >
          Save Rules
        </button>
      </section>

      {/* Exceptions */}
      <section>
        <h2 className="font-medium mb-2">Exceptions</h2>
        <div className="flex gap-2 items-center">
          <input type="date" value={exceptionDate}
            onChange={e=>setExceptionDate(e.target.value)}
            className="bg-neutral-900 px-2 py-1 rounded" />
          {!exceptionBlocked && (
            <>
              <input type="time" value={exceptionOpen}
                onChange={e=>setExceptionOpen(e.target.value)}
                className="bg-neutral-900 px-2 py-1 rounded" />
              <input type="time" value={exceptionClose}
                onChange={e=>setExceptionClose(e.target.value)}
                className="bg-neutral-900 px-2 py-1 rounded" />
            </>
          )}
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={exceptionBlocked}
              onChange={e=>setExceptionBlocked(e.target.checked)} />
            Block all
          </label>
        </div>
        <button
          className="mt-3 px-4 py-2 rounded bg-sky-600 hover:bg-sky-500"
          onClick={() => call("/api/admin/availability/exception", {
            date: exceptionDate,
            open: exceptionOpen,
            close: exceptionClose,
            blocked: exceptionBlocked
          })}
        >
          Save Exception
        </button>
      </section>

      {/* Maintenance */}
      <section>
        <h2 className="font-medium mb-2">Maintenance</h2>
        <button
          className="px-4 py-2 rounded bg-orange-600 hover:bg-orange-500 mr-2"
          onClick={() => call("/api/admin/slots/recompute", {})}
        >
          Recompute next 14 days
        </button>
        <button
          className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-500"
          onClick={() => call("/api/admin/slots/cleanup", {})}
        >
          Delete past slots
        </button>
      </section>

      <pre className="text-xs bg-neutral-900 p-3 rounded">{log}</pre>
    </div>
  );
}
