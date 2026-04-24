"use client";

import * as React from "react";
import { Check, X } from "lucide-react";

type Config = {
  nextSessionAt: string | null;
  updatedAt: string;
};

type QueueRow = {
  id: string;
  discordId: string;
  globalName: string | null;
  discordName: string | null;
  riotTag: string;
  puuid: string | null;
  role: string;
  queueDate: string;
  previousReviews: number;
  paidPriority: boolean;
  reviewStatus: "Pending" | "Done";
  createdAt: string;
  updatedAt: string;
};

export default function SpeedReviewAdmin() {
  const [config, setConfig] = React.useState<Config | null>(null);
  const [rows, setRows] = React.useState<QueueRow[]>([]);
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<string>("Pending");
  const [paid, setPaid] = React.useState<string>("");
  const [nextInput, setNextInput] = React.useState("");
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  const loadConfig = React.useCallback(async () => {
    const res = await fetch("/api/admin/speed-review/config");
    if (!res.ok) return;
    const j = await res.json();
    setConfig(j);
    if (j.nextSessionAt) {
      const d = new Date(j.nextSessionAt);
      setNextInput(toLocalDatetimeValue(d));
    } else {
      setNextInput("");
    }
  }, []);

  const loadQueue = React.useCallback(async () => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (status === "Pending" || status === "Done") p.set("status", status);
    if (paid === "true" || paid === "false") p.set("paid", paid);
    const res = await fetch(`/api/admin/speed-review/queue?${p.toString()}`);
    if (!res.ok) return;
    const j = await res.json();
    setRows(j.rows ?? []);
  }, [q, status, paid]);

  React.useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  React.useEffect(() => {
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only; filters use "Apply"
  }, []);

  async function saveConfig(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    const res = await fetch("/api/admin/speed-review/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        nextInput.trim()
          ? { nextSessionAt: new Date(nextInput).toISOString() }
          : { clear: true }
      ),
    });
    if (!res.ok) {
      setErr("Failed to save config");
      return;
    }
    setMsg("Saved next session time.");
    loadConfig();
  }

  async function patchRow(id: string, data: Record<string, unknown>) {
    setErr(null);
    const res = await fetch(`/api/admin/speed-review/queue/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "Update failed");
      return;
    }
    loadQueue();
  }

  async function removeRow(id: string) {
    setErr(null);
    const res = await fetch(`/api/admin/speed-review/queue/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setErr("Delete failed");
      return;
    }
    loadQueue();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 text-white space-y-8">
      <h1 className="text-2xl font-bold">Speed review queue</h1>

      <section className="rounded-xl border border-white/10 p-4 space-y-3">
        <h2 className="font-semibold">Next session (public)</h2>
        {config && (
          <p className="text-sm text-white/60">
            Current:{" "}
            {config.nextSessionAt
              ? new Date(config.nextSessionAt).toLocaleString()
              : "— not set"}{" "}
            · updated {new Date(config.updatedAt).toLocaleString()}
          </p>
        )}
        <form onSubmit={saveConfig} className="flex flex-wrap gap-2 items-end">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/60">Next session (local)</span>
            <input
              type="datetime-local"
              value={nextInput}
              onChange={(e) => setNextInput(e.target.value)}
              className="rounded bg-white/5 border border-white/15 px-2 py-1 text-white"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 px-3 py-1.5 text-sm font-medium"
          >
            Save
          </button>
          <button
            type="button"
            className="rounded-lg border border-white/20 px-3 py-1.5 text-sm"
            onClick={async () => {
              setErr(null);
              await fetch("/api/admin/speed-review/config", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clear: true }),
              });
              setNextInput("");
              loadConfig();
              setMsg("Cleared next session.");
            }}
          >
            Clear
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-white/10 p-4 space-y-3">
        <h2 className="font-semibold">Filters</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            placeholder="Search name / Riot / Discord"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="rounded bg-white/5 border border-white/15 px-2 py-1 text-sm flex-1 min-w-[200px]"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded bg-white/5 border border-white/15 px-2 py-1 text-sm"
          >
            <option value="Pending">Pending</option>
            <option value="">All statuses</option>
            <option value="Done">Done</option>
          </select>
          <select
            value={paid}
            onChange={(e) => setPaid(e.target.value)}
            className="rounded bg-white/5 border border-white/15 px-2 py-1 text-sm"
          >
            <option value="">Paid: any</option>
            <option value="true">Priority</option>
            <option value="false">Standard</option>
          </select>
          <button
            type="button"
            onClick={() => loadQueue()}
            className="text-sm text-cyan-400 underline"
          >
            Apply
          </button>
        </div>
      </section>

      {msg && <p className="text-green-400 text-sm">{msg}</p>}
      {err && <p className="text-red-400 text-sm">{err}</p>}

      <section className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm text-left">
          <thead className="bg-white/5 text-white/80">
            <tr>
              <th className="p-2 w-10">#</th>
              <th className="p-2">Discord</th>
              <th className="p-2">Riot</th>
              <th className="p-2">Role</th>
              <th className="p-2">Queue date</th>
              <th className="p-2">Prev</th>
              <th className="p-2">Paid</th>
              <th className="p-2">Status</th>
              <th className="p-2 w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <QueueRowView
                key={r.id}
                index={i}
                row={r}
                onPatch={patchRow}
                onDelete={removeRow}
              />
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-4 text-white/50 text-sm">No rows.</p>
        )}
      </section>
    </div>
  );
}

function toLocalDatetimeValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

function QueueRowView({
  index,
  row,
  onPatch,
  onDelete,
}: {
  index: number;
  row: QueueRow;
  onPatch: (id: string, data: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}) {
  const [queueDateLocal, setQueueDateLocal] = React.useState(() =>
    toLocalDatetimeValue(new Date(row.queueDate))
  );
  const [cursorPopup, setCursorPopup] = React.useState<{ x: number; y: number } | null>(null);
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    setQueueDateLocal(toLocalDatetimeValue(new Date(row.queueDate)));
  }, [row.id, row.queueDate]);

  React.useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    []
  );

  function scheduleQueueDateSave(localValue: string) {
    setQueueDateLocal(localValue);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      onPatch(row.id, { queueDate: new Date(localValue).toISOString() });
    }, 450);
  }

  function copyDiscord(e: React.MouseEvent) {
    const text = row.globalName?.trim() || row.discordName?.trim();
    if (!text) return;
    void navigator.clipboard.writeText(text);
    setCursorPopup({ x: e.clientX, y: e.clientY });
    setTimeout(() => setCursorPopup(null), 700);
  }

  const riotClean = row.riotTag.replace("#", "-");
  const dpmHref = riotClean ? `https://dpm.lol/${riotClean}` : undefined;

  return (
    <tr className="border-t border-white/10 align-top">
      <td className="p-2 text-white/50 align-middle relative">
        {cursorPopup && (
          <div
            className="fixed pointer-events-none z-[9999] text-sm text-white bg-black/80 px-2 py-1 rounded shadow-lg"
            style={{ left: cursorPopup.x + 10, top: cursorPopup.y + 10 }}
          >
            Copied!
          </div>
        )}
        {index + 1}
      </td>
      <td className="p-2 align-middle">
        <button
          type="button"
          onClick={copyDiscord}
          className={`text-left max-w-[140px] truncate ${
            row.discordName
              || row.globalName
              ? "font-medium text-white hover:text-cyan-300 hover:underline"
              : "text-white/50 cursor-default"
          }`}
          disabled={!row.globalName && !row.discordName}
          title={row.globalName || row.discordName ? "Copy Discord name" : undefined}
        >
          {row.globalName ?? row.discordName ?? "—"}
        </button>
      </td>
      <td className="p-2 align-middle">
        {dpmHref ? (
          <a
            href={dpmHref}
            target="_blank"
            rel="noreferrer noopener"
            className="font-medium text-white hover:text-purple-300 hover:underline max-w-[160px] inline-block truncate"
            title={dpmHref}
          >
            {row.riotTag}
          </a>
        ) : (
          <span className="text-white/50">—</span>
        )}
      </td>
      <td className="p-2 text-white/90 align-middle">{row.role}</td>
      <td className="p-2 align-middle">
        <input
          type="datetime-local"
          value={queueDateLocal}
          onChange={(e) => scheduleQueueDateSave(e.target.value)}
          className="w-[11.5rem] max-w-full bg-white/5 border border-white/10 rounded px-1.5 py-1 text-xs text-white"
        />
      </td>
      <td className="p-2 tabular-nums text-white/80 align-middle">{row.previousReviews}</td>
      <td className="p-2 align-middle">
        <span
          className={`inline-block rounded px-2 py-0.5 text-xs ${
            row.paidPriority
              ? "bg-amber-500/20 text-amber-200"
              : "bg-white/10 text-white/70"
          }`}
        >
          {row.paidPriority ? "Priority" : "Standard"}
        </span>
      </td>
      <td className="p-2 align-middle">
        <span
          className={`text-xs ${
            row.reviewStatus === "Done" ? "text-emerald-400/90" : "text-white/60"
          }`}
        >
          {row.reviewStatus}
        </span>
      </td>
      <td className="p-2 align-middle">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            title="Mark review done"
            disabled={row.reviewStatus === "Done"}
            onClick={() => onPatch(row.id, { reviewStatus: "Done" })}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            title="Remove from queue"
            onClick={() => onDelete(row.id)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/40 bg-red-500/15 text-red-300 hover:bg-red-500/25"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </td>
    </tr>
  );
}
