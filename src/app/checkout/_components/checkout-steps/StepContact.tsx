// src/pages/customization/checkout/rcolumn/checkout-steps/StepContact.tsx
"use client";
import * as React from "react";
import PrimaryCTA from "@/app/_components/small/buttons/PrimaryCTA";

type DiscordIdentity = {
  id: string;
  username?: string | null;
  globalName?: string | null;
};

type Props = {
  riotTag?: string;
  notes?: string;
  setRiotTag: (v: string) => void;
  setNotes: (v: string) => void;
  onDiscordLinked: (u: DiscordIdentity) => void;
  discordIdentity?: DiscordIdentity | null;
  contactErr: string | null;
  riotInputRef: React.RefObject<HTMLInputElement | null>;
  onSubmit: () => void;
  onRiotVerified?: (d: { riotTag: string; puuid: string; region: string }) => void;
};

function isValidRiotTagFormat(v: string) {
  const s = v.trim();
  return /^[A-Za-z0-9 .'_\-]{3,16}#[A-Za-z0-9]{3,5}$/.test(s);
}
type CheckStatus = "idle" | "checking" | "ok" | "bad";

export default function StepContact({
  riotTag,
  notes,
  setRiotTag,
  setNotes,
  onDiscordLinked,
  discordIdentity,
  contactErr,
  riotInputRef,
  onSubmit,
  onRiotVerified,
}: Props) {
  const riotVal = riotTag ?? "";
  const notesVal = notes ?? "";

  const [submitted, setSubmitted] = React.useState(false);
  const [checkStatus, setCheckStatus] = React.useState<CheckStatus>("idle");

  const lastVerifiedRef = React.useRef<string>("");
  const abortRef = React.useRef<AbortController | null>(null);

  const baseInput =
    "mt-1 w-full rounded-lg bg-white/[.05] ring-1 px-4 py-3 text-base text-white/90 outline-none transition";
  const okRing = "ring-white/12 focus:ring-white/25";
  const badRing = "ring-red-500/70 focus:ring-red-500";

  // RiotTag verify (debounced)
  React.useEffect(() => {
    const val = riotVal.trim();

    if (!val || !isValidRiotTagFormat(val)) {
      setCheckStatus(val ? "bad" : "idle");
      abortRef.current?.abort();
      return;
    }

    setCheckStatus("checking");

    const t = setTimeout(async () => {
      try {
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;

        const res = await fetch("/api/riot/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ riotTag: val }),
          signal: ctrl.signal,
        });

        if (!res.ok) { setCheckStatus("bad"); return; }
        const data = await res.json().catch(() => ({}));
        if (data?.puuid) {
          setCheckStatus("ok");
          if (onRiotVerified && lastVerifiedRef.current !== val) {
            lastVerifiedRef.current = val;
            onRiotVerified({
              riotTag: val,
              puuid: String(data.puuid),
              region: String(data.region || "europe"),
            });
          }
        } else {
          setCheckStatus("bad");
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") setCheckStatus("bad");
      }
    }, 500);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riotVal]);

  // Open popup
  const openDiscordOAuth = React.useCallback(() => {
    window.open("/api/checkout/discord/oauth-start", "discord_oauth", "width=520,height=700");
  }, []);

  // Global message listener
  React.useEffect(() => {
    const receive = (ev: MessageEvent) => {
      // Leave origin open while debugging; tighten later:
      // if (ev.origin !== window.location.origin) return;

      let data: any = ev.data;
      if (typeof data === "string") {
        try { data = JSON.parse(data); } catch { /* ignore */ }
      }
      if (!data || typeof data !== "object") return;

      if (data.type === "discord-auth-success" && data.user) {
        onDiscordLinked(data.user as DiscordIdentity);
      }
    };

    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [onDiscordLinked]);

  const formatValid = isValidRiotTagFormat(riotVal);
  const riotShowError = checkStatus === "bad" || (submitted && !formatValid);
  const canSubmit = checkStatus === "ok" && !!discordIdentity?.id;

  // Icons
  const Spinner = () => (
    <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-white/70" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  );
  const OkIcon = () => (
    <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="#60a5fa" />
      <path d="M5 10.5l3 3 7-7" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  const BadIcon = () => (
    <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="#ef4444" />
      <path d="M6 6l8 8M14 6l-8 8" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  const hint =
    !formatValid && riotVal.trim()
      ? ""
      : checkStatus === "bad"
      ? "Invalid Riot#tag — check spelling"
      : "";

  return (
    <div className="h-full flex flex-col pt-2">
      <div className="mb-3">
        <div className="relative h-7 flex items-center justify-center">
          <div className="text-sm text-white/80">Contact details</div>
        </div>
        <div className="mt-2 border-t border-white/10" />
      </div>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
          if (canSubmit) onSubmit();
        }}
        className="flex-1 flex flex-col"
      >
        <div className="flex-1 space-y-3">
          {/* RiotTag */}
          <label className="block">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/65">Summoner name</span>
              {hint ? <span className="text-[11px] text-red-400">{hint}</span> : null}
            </div>
            <div className="relative">
              <input
                ref={riotInputRef}
                type="text"
                value={riotVal}
                onChange={(e) => setRiotTag(e.target.value)}
                placeholder="Riot#Tag of your main account"
                aria-invalid={riotShowError}
                spellCheck={false}
                className={`${baseInput} ${riotShowError ? badRing : okRing} pr-9`}
              />
              {checkStatus === "checking" && <Spinner />}
              {checkStatus === "ok" && <OkIcon />}
              {checkStatus === "bad" && riotVal.trim() && <BadIcon />}
            </div>
          </label>

          {/* Discord OAuth */}
          <div className="block">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/65">Discord</span>
            </div>
            <div className="mt-1 flex items-center justify-between rounded-lg bg-white/[.05] ring-1 ring-white/12 px-3 py-2">
              {discordIdentity?.id ? (
                <div className="text-sm text-white/90">
                  Linked:{" "}
                  <span className="font-medium">
                    {discordIdentity.globalName || discordIdentity.username}
                  </span>
                </div>
              ) : (
                <div className="text-sm text-white/70">Not linked to Discord</div>
              )}

              <button
                type="button"
                onClick={openDiscordOAuth}
                className="ml-3 rounded-lg px-3 py-2 text-sm font-semibold text-[#0A0A0A] bg-[#59f] hover:bg-[#7ab0ff] transition ring-1 ring-white/15"
              >
                {discordIdentity?.id ? "Relink Discord" : "Link Discord"}
              </button>
            </div>
            {!discordIdentity?.id && submitted && (
              <div className="mt-1 text-xs text-red-400">Please link your Discord account.</div>
            )}
          </div>

          {/* Notes */}
          <label className="block">
            <span className="text-xs text-white/65">Anything you want me to know</span>
            <textarea
              value={notesVal}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="(Optional)"
              spellCheck={false}
              className={`${baseInput} ${okRing} resize-none min-h-[110px]`}
            />
          </label>

          {contactErr && <div className="text-sm text-red-400 mt-1">{contactErr}</div>}
        </div>

        <PrimaryCTA type="submit" disabled={!canSubmit} className="px-5 py-3 text-base w-full">
          Continue
        </PrimaryCTA>
      </form>
    </div>
  );
}
