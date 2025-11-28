"use client";
import * as React from "react";
import { useFooter } from "@/app/checkout/_components/checkout-steps/FooterContext";

type DiscordIdentity = { id: string; username?: string | null };

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

// keep spaces elsewhere, but remove spaces around '#'
function normalizeRiotTag(v: string) {
  return v.trim().replace(/\s*#\s*/g, "#");
}
function isValidRiotTagFormat(v: string) {
  const s = normalizeRiotTag(v);
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

  const [, setFooter] = useFooter();
  const formRef = React.useRef<HTMLFormElement>(null);

  const baseInput =
    "mt-1 w-full rounded-lg bg-white/[.05] ring-1 px-4 py-3 text-base text-white/90 outline-none transition";
  const okRing = "ring-inset ring-white/12 focus:ring-inset focus:ring-white/25";
  const badRing = "ring-inset ring-red-500/70 focus:ring-inset ring-red-500";

  // 🔥 removed normalization effect

  React.useEffect(() => {
    const val = normalizeRiotTag(riotVal);

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
        if (!res.ok) return setCheckStatus("bad");
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
        } else setCheckStatus("bad");
      } catch (e: any) {
        if (e?.name !== "AbortError") setCheckStatus("bad");
      }
    }, 500);

    return () => clearTimeout(t);
  }, [riotVal]);

  const onRiotInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRiotTag(e.target.value);
  };

  const onRiotInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setRiotTag(e.target.value);
  };

  const openDiscordOAuth = React.useCallback(() => {
    window.open("/api/checkout/discord/oauth-start", "discord_oauth", "width=520,height=700");
  }, []);

  const handleIncoming = React.useCallback(
    (incoming: any) => {
      let data = incoming;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      if (!data || typeof data !== "object") return;

      if (data.type === "discord-auth-success" && data.user) {
        onDiscordLinked(data.user as DiscordIdentity);

        if (onRiotVerified) {
          onRiotVerified({
            riotTag: normalizeRiotTag(riotVal),
            puuid: "",
            region: "",
          });
        }
      }
    },
    [onDiscordLinked, onRiotVerified, riotVal]
  );

  React.useEffect(() => {
    const onMsg = (ev: MessageEvent) => handleIncoming(ev.data);
    window.addEventListener("message", onMsg);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("dc_oauth");
      bc.onmessage = (ev) => handleIncoming((ev as MessageEvent).data);
    } catch {}

    const onFocus = () => {
      try {
        const raw = localStorage.getItem("dc_oauth_payload");
        if (raw) {
          handleIncoming(raw);
          localStorage.removeItem("dc_oauth_payload");
        }
      } catch {}
    };
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("message", onMsg);
      window.removeEventListener("focus", onFocus);
      try {
        bc?.close();
      } catch {}
    };
  }, [handleIncoming]);

  const formatValid = isValidRiotTagFormat(normalizeRiotTag(riotVal));
  const riotShowError = checkStatus === "bad" || (submitted && !formatValid);
  const canSubmit = checkStatus === "ok" && !!discordIdentity?.id;

  const hint =
    !formatValid && riotVal.trim()
      ? ""
      : checkStatus === "bad"
      ? "Invalid Riot#tag — check spelling"
      : "";

  React.useEffect(() => {
    setFooter({
      label: "Continue",
      disabled: !canSubmit,
      loading: false,
      onClick: () => formRef.current?.requestSubmit(),
      hidden: false,
    });
  }, [setFooter, canSubmit]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3">
        <div className="relative h-7 flex items-center justify-center">
          <div className="text-sm text-white/80">Contact details</div>
        </div>
        <div className="mt-2 border-t border-white/10" />
      </div>

      <form
        ref={formRef}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
          if (canSubmit) onSubmit();
        }}
        className="flex flex-col flex-1"
      >
        <div className="flex-1 min-h-0 space-y-3 px-1">

          <label className="block">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/65">Summoner name</span>
              </div>
              {hint ? (
                <span className="text-xs font-semibold text-red-400">{hint}</span>
              ) : null}
            </div>

            <div className="relative">
              <input
                ref={riotInputRef}
                type="text"
                value={riotVal}
                onChange={onRiotInputChange}
                onBlur={onRiotInputBlur}
                placeholder="Riot#Tag of your main account"
                aria-invalid={riotShowError}
                spellCheck={false}
                className={`${baseInput} ${riotShowError ? badRing : okRing} pr-9`}
              />
              {checkStatus === "checking" && (
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-white/70"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-90"
                    fill="currentColor"
                    d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
                  />
                </svg>
              )}
              {checkStatus === "ok" && (
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <circle cx="10" cy="10" r="9" fill="#60a5fa" />
                  <path
                    d="M5 10.5l3 3 7-7"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {checkStatus === "bad" && riotVal.trim() && (
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <circle cx="10" cy="10" r="9" fill="#ef4444" />
                  <path
                    d="M6 6l8 8M14 6l-8 8"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
          </label>

          {/* Discord OAuth */}
          <div className="block">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/65">Discord</span>
              {!discordIdentity?.id && submitted && (
                <span className="text-xs font-semibold text-red-400">
                  Please link your Discord account.
                </span>
              )}
            </div>

            <div
              className={`mt-1 flex items-center justify-between rounded-lg h-12 px-4
                          bg-white/[.05] ring-1 ring-inset ${
                !discordIdentity?.id && submitted
                  ? "ring-red-500/70"
                  : "ring-white/12"
              }`}
            >
              <div className="truncate text-[13px] font-semibold">
                {discordIdentity?.id ? (
                  <span className="text-white/90">{discordIdentity.username}</span>
                ) : (
                  <span className="text-white/80">Not linked to Discord</span>
                )}
              </div>

              <button
                type="button"
                onClick={openDiscordOAuth}
                className="rounded-lg px-3 h-9 text-[13px] font-semibold text-[#0A0A0A]
                           bg-[#59f] hover:bg-[#7ab0ff] transition ring-1 ring-inset ring-white/15 -mr-2"
              >
                {discordIdentity?.id ? "Relink Discord" : "Link Discord"}
              </button>
            </div>
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
      </form>
    </div>
  );
}
