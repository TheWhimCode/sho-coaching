"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { claimDonationPrompt, DONATION_LOOKUP_EVENT } from "@/lib/guides/buildPicker/donationPrompt";

export default function DonationPrompt() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkEligibility = () => {
      try {
        if (claimDonationPrompt(localStorage)) setOpen(true);
      } catch {
        // Skip when persistence is unavailable rather than repeatedly asking.
      }
    };
    checkEligibility();
    window.addEventListener(DONATION_LOOKUP_EVENT, checkEligibility);
    window.addEventListener("storage", checkEligibility);
    return () => {
      window.removeEventListener(DONATION_LOOKUP_EVENT, checkEligibility);
      window.removeEventListener("storage", checkEligibility);
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    if (!dialog.open) dialog.show();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dialog.close();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function dismiss() {
    dialogRef.current?.close();
    setOpen(false);
  }

  async function donate() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/donation/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "build_recommender" }),
      });
      const data = await response.json() as { url?: string };
      if (!response.ok || !data.url) throw new Error("checkout_failed");
      window.location.assign(data.url);
    } catch {
      setError("Could not open checkout. Please try again.");
      setLoading(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="donation-prompt-title"
      aria-describedby="donation-prompt-copy donation-prompt-once"
      onClose={() => setOpen(false)}
      className="donation-prompt fixed inset-auto bottom-0 left-0 right-0 z-50 m-0 w-full max-w-none overflow-hidden border-0 border-t border-[#B8D8EA]/15 bg-[#111624]/95 p-0 text-[#F5E6D3] shadow-[0_12px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:bottom-6 sm:left-auto sm:right-6 sm:w-[calc(100%_-_2rem)] sm:max-w-[22rem] sm:border"
    >
      <div className="relative px-7 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 text-left sm:py-5">
        <div className="flex items-center justify-between gap-3">
          <h2 id="donation-prompt-title" className="donation-enter donation-enter-title text-lg font-semibold tracking-tight text-[#FAD4E8]">Find this helpful?</h2>
          <button type="button" onClick={dismiss} aria-label="Close donation request" className="-mr-2 -mt-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#F5E6D3]/55 transition hover:bg-white/[0.06] hover:text-[#FAD4E8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F0ABCF]">
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>
        <p id="donation-prompt-copy" className="donation-enter donation-enter-copy mt-1 text-sm leading-relaxed text-[#F5E6D3]/65">
          Please support me if you can &gt;.&lt;
        </p>
        <button type="button" onClick={donate} disabled={loading} className="donation-enter donation-enter-button mt-5 inline-flex items-center justify-center rounded-full border-2 border-[#F0ABCF] bg-[#FAD4E8] px-6 py-3 text-sm font-bold text-[#4A354F] shadow-[0_0_24px_rgba(250,212,232,0.55)] transition hover:border-[#F5C4DC] hover:bg-[#FCE8F2] hover:text-[#2A1F2E] hover:shadow-[0_0_30px_rgba(240,171,207,0.5)] disabled:cursor-not-allowed disabled:opacity-60 sm:px-7 sm:text-base">
          {loading ? "Opening checkout…" : "Donate"}
        </button>
        {error ? <p role="alert" className="mt-3 text-xs text-[#F0ABCF]">{error}</p> : null}
        <p id="donation-prompt-once" className="donation-enter donation-enter-footer mt-4 border-t border-white/[0.06] pt-3 text-[11px] leading-relaxed text-[#F5E6D3]/40">This pop-up won&apos;t appear again in this browser.</p>
      </div>
    </dialog>
  );
}
