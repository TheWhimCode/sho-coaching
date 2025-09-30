"use client";
import * as React from "react";

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
};

// Riot ID validator: GameName#TAG
function isValidRiotTag(v: string) {
  const s = v.trim();
  return /^[A-Za-z0-9 .'_\-]{3,16}#[A-Za-z0-9]{3,5}$/.test(s);
}

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
}: Props) {
  const riotVal = riotTag ?? "";
  const notesVal = notes ?? "";
  const [submitted, setSubmitted] = React.useState(false);
  const riotInvalid = riotVal.trim() === "" || !isValidRiotTag(riotVal);

  const baseInput =
    "mt-1 w-full rounded-lg bg-white/[.05] ring-1 px-4 py-3 text-base text-white/90 outline-none transition";
  const okRing = "ring-white/12 focus:ring-white/25";
  const badRing = "ring-red-500/70 focus:ring-red-500";

  // OAuth popup handler
  const openDiscordOAuth = React.useCallback(() => {
    const w = window.open(
      "/api/discord/oauth/start",
      "discord_oauth",
      "width=520,height=700"
    );
    if (!w) return;

    const receive = (ev: MessageEvent) => {
      if (!ev?.data || typeof ev.data !== "object") return;
      if (ev.data.type === "discord-auth-success" && ev.data.user) {
        const u = ev.data.user as DiscordIdentity;
        onDiscordLinked(u);
        window.removeEventListener("message", receive);
      }
      if (ev.data.type === "discord-auth-cancel") {
        window.removeEventListener("message", receive);
      }
    };
    window.addEventListener("message", receive);
  }, [onDiscordLinked]);

  const canSubmit = !riotInvalid && !!discordIdentity?.id;

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
            <span className="text-xs text-white/65">RiotTag</span>
            <input
              ref={riotInputRef}
              type="text"
              value={riotVal}
              onChange={(e) => setRiotTag(e.target.value)}
              placeholder="GameName#TAG (e.g., CoachCat#EUW)"
              aria-invalid={submitted && riotInvalid}
              className={`${baseInput} ${
                submitted && riotInvalid ? badRing : okRing
              }`}
            />
            {submitted && riotInvalid && (
              <div className="mt-1 text-xs text-red-400">
                Use the format GameName#TAG (GameName 3–16 chars; TAG 3–5).
              </div>
            )}
          </label>

          {/* Discord OAuth */}
          <div className="block">
            <span className="text-xs text-white/65">Discord</span>
            <div className="mt-1 flex items-center justify-between rounded-lg bg-white/[.05] ring-1 ring-white/12 px-3 py-2">
              {discordIdentity?.id ? (
                <div className="text-sm text-white/90">
                  Linked:{" "}
                  <span className="font-medium">
                    {discordIdentity.globalName || discordIdentity.username}
                  </span>
                  <span className="text-white/50 ml-2">
                    ({discordIdentity.id})
                  </span>
                </div>
              ) : (
                <div className="text-sm text-white/70">
                  Not linked to Discord
                </div>
              )}

              <button
                type="button"
                onClick={openDiscordOAuth}
                className="ml-3 rounded-lg px-3 py-2 text-sm font-semibold text-[#0A0A0A]
                           bg-[#59f] hover:bg-[#7ab0ff] transition ring-1 ring-white/15"
              >
                {discordIdentity?.id ? "Relink Discord" : "Link Discord"}
              </button>
            </div>
            {!discordIdentity?.id && submitted && (
              <div className="mt-1 text-xs text-red-400">
                Please link your Discord account.
              </div>
            )}
          </div>

          {/* Notes */}
          <label className="block">
            <span className="text-xs text-white/65">
              Anything you want me to know
            </span>
            <textarea
              value={notesVal}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="(Optional)"
              className={`${baseInput} ${okRing} resize-none min-h-[110px]`}
            />
          </label>

          {/* API / form error */}
          {contactErr && (
            <div className="text-sm text-red-400 mt-1">{contactErr}</div>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full rounded-xl px-5 py-3 text-base font-semibold text-[#0A0A0A]
            ${canSubmit ? "bg-[#fc8803] hover:bg-[#f8a81a]" : "bg-white/15"}
            transition shadow-[0_10px_28px_rgba(245,158,11,.35)]
            ring-1 ring-[rgba(255,190,80,.55)] disabled:opacity-60`}
        >
          Continue
        </button>
      </form>
    </div>
  );
}
