"use client";

import { useCallback, useEffect, useState } from "react";
import { FaTwitch } from "react-icons/fa6";

export default function TwitchLiveButton() {
  const [isLive, setIsLive] = useState(false);
  const [streamTitle, setStreamTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/admin/twitch-live", { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as {
          isLive: boolean;
          streamTitle: string | null;
        };
        if (cancelled) return;
        setIsLive(data.isLive);
        setStreamTitle(data.streamTitle ?? "");
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (nextLive: boolean, title: string) => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/twitch-live", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isLive: nextLive,
          streamTitle: title.trim() || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      const data = (await res.json()) as {
        isLive: boolean;
        streamTitle: string | null;
      };

      setIsLive(data.isLive);
      setStreamTitle(data.streamTitle ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, []);

  const toggleLive = () => {
    if (loading || saving) return;
    void persist(!isLive, streamTitle);
  };

  return (
    <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
      {isLive ? (
        <input
          type="text"
          value={streamTitle}
          onChange={(e) => setStreamTitle(e.target.value)}
          onBlur={() => void persist(true, streamTitle)}
          placeholder="Stream title (optional)"
          maxLength={140}
          disabled={saving}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 sm:w-56"
        />
      ) : null}

      <button
        type="button"
        onClick={toggleLive}
        disabled={loading || saving}
        className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition disabled:opacity-60
          ${
            isLive
              ? "border border-[#FF4D6D]/60 bg-[#FF4D6D]/20 text-[#FFB3C1] shadow-[0_0_20px_rgba(255,77,109,0.25)]"
              : "border border-[#9146FF]/55 bg-[#9146FF]/20 text-[#E4CCFF] hover:bg-[#9146FF]/30"
          }`}
      >
        <FaTwitch className="h-4 w-4 shrink-0" aria-hidden />
        {loading ? "…" : saving ? "Saving…" : "Go live"}
        {isLive ? (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF4D6D] opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF4D6D]" />
          </span>
        ) : null}
      </button>

      {error ? <span className="text-xs text-red-300">{error}</span> : null}
    </div>
  );
}
