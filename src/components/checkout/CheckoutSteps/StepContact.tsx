"use client";
import * as React from "react";

// accept either kind of ref (works with useRef)
type InputRef =
  | React.MutableRefObject<HTMLInputElement | null>
  | React.RefObject<HTMLInputElement>;

type Props = {
  email: string;
  discord: string;
  notes: string;
  setEmail: (v: string) => void;
  setDiscord: (v: string) => void;
  setNotes: (v: string) => void;
  contactErr: string | null;
  emailInputRef: InputRef;
  discordInputRef: InputRef;
  onSubmit: () => void;
};

export default function StepContact({
  email,
  discord,
  notes,
  setEmail,
  setDiscord,
  setNotes,
  contactErr,
  emailInputRef,
  discordInputRef,
  onSubmit,
}: Props) {
  return (
    <div className="h-full flex flex-col rounded-xl pt-2 px-4 pb-4 bg-transparent">
      <div className="mb-3">
        <div className="relative h-7 flex items-center justify-center">
          <div className="text-sm text-white/80">Contact details</div>
        </div>
        <div className="mt-2 border-t border-white/10" />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="flex-1 flex flex-col"
      >
        <div className="flex-1 space-y-3">
          <label className="block">
            <span className="text-xs text-white/65">E-Mail</span>
            <input
              ref={emailInputRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="mt-1 w-full rounded-lg bg-white/[.05] ring-1 ring-white/12 px-4 py-3 text-base text-white/90 outline-none focus:ring-white/25"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs text-white/65">Discord</span>
            <input
              ref={discordInputRef}
              type="text"
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
              placeholder="Discord"
              pattern="^[A-Za-z0-9][A-Za-z0-9._]{1,31}$"
              className="mt-1 w-full rounded-lg bg-white/[.05] ring-1 ring-white/12 px-4 py-3 text-base text-white/90 outline-none focus:ring-white/25"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs text-white/65">Additional notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Anything you'd like me to know…"
              className="mt-1 w-full rounded-lg bg-white/[.05] ring-1 ring-white/12 px-4 py-3 text-base text-white/90 outline-none focus:ring-white/25 resize-none min-h-[110px]"
            />
          </label>
          {contactErr && <p className="text-sm text-red-400">{contactErr}</p>}
        </div>

        <button
          type="submit"
          className="mt-3 w-full rounded-xl px-5 py-3 text-base font-semibold text-[#0A0A0A]
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
