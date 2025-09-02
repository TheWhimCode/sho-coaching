"use client";
import * as React from "react";

type InputRef =
  | React.MutableRefObject<HTMLInputElement | null>
  | React.RefObject<HTMLInputElement>;

type Props = {
  email?: string;                // ← may be undefined on first render
  discord?: string;              // ← same
  notes?: string;
  setEmail: (v: string) => void;
  setDiscord: (v: string) => void;
  setNotes: (v: string) => void;
  contactErr: string | null;
  emailInputRef: InputRef;
  discordInputRef: InputRef;
  onSubmit: () => void;
};

function isValidEmail(v: string) {
  const s = v.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
function isValidDiscord(v: string) {
  const s = v.trim();
  const newStyle = /^[a-z0-9._]{2,32}$/.test(s);
  const legacy = /^[A-Za-z0-9 _.\-]{2,32}#\d{4}$/.test(s);
  return newStyle || legacy;
}

export default function StepContact({
  email,
  discord,
  notes,
  setEmail,
  setDiscord,
  setNotes,
  contactErr, // kept for API
  emailInputRef,
  discordInputRef,
  onSubmit,
}: Props) {
  // ✅ safe defaults so .trim() never crashes
  const emailVal = email ?? "";
  const discordVal = discord ?? "";
  const notesVal = notes ?? "";

  const [submitted, setSubmitted] = React.useState(false);

  const emailInvalid = emailVal.trim() === "" || !isValidEmail(emailVal);
  const discordInvalid = discordVal.trim() === "" || !isValidDiscord(discordVal);

  const baseInput =
    "mt-1 w-full rounded-lg bg-white/[.05] ring-1 px-4 py-3 text-base text-white/90 outline-none transition";
  const okRing = "ring-white/12 focus:ring-white/25";
  const badRing = "ring-red-500/70 focus:ring-red-500";

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
          if (!emailInvalid && !discordInvalid) onSubmit();
        }}
        className="flex-1 flex flex-col"
      >
        <div className="flex-1 space-y-3">
          <label className="block">
            <span className="text-xs text-white/65">E-Mail</span>
            <input
              ref={emailInputRef}
              type="email"
              value={emailVal}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              aria-invalid={submitted && emailInvalid}
              className={`${baseInput} ${submitted && emailInvalid ? badRing : okRing}`}
            />
          </label>

          <label className="block">
            <span className="text-xs text-white/65">Discord</span>
            <input
              ref={discordInputRef}
              type="text"
              value={discordVal}
              onChange={(e) => setDiscord(e.target.value)}
              placeholder="Discord"
              aria-invalid={submitted && discordInvalid}
              className={`${baseInput} ${submitted && discordInvalid ? badRing : okRing}`}
            />
          </label>

          <label className="block">
            <span className="text-xs text-white/65">Anything you want me to know</span>
            <textarea
              value={notesVal}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="(Optional)"
              className={`${baseInput} ${okRing} resize-none min-h-[110px]`}
            />
          </label>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl px-5 py-3 text-base font-semibold text-[#0A0A0A]
                     bg-[#fc8803] hover:bg-[#f8a81a] transition
                     shadow-[0_10px_28px_rgba(245,158,11,.35)]
                     ring-1 ring-[rgba(255,190,80,.55)]"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
