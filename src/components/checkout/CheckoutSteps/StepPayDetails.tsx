"use client";

import { useState } from "react";
import { useElements } from "@stripe/react-stripe-js";
import CardForm from "@/components/checkout/CardForm";

type Props =
  | { mode: "loading"; goBack: () => void; loadingIntent: boolean }
  | {
      mode: "form";
      goBack: () => void;
      email: string;
      payMethod: "card" | "paypal" | "revolut_pay";
      onContinue: () => void;
      piId?: string | null;
    };

export default function StepPayDetails(props: Props) {
  if (props.mode === "loading") {
    const { goBack } = props;
    return (
      <div className="h-full flex flex-col rounded-xl p-4 ring-1 ring-white/12 bg-white/[.04]">
        <div className="mb-3">
          <div className="relative h-7 flex items-center justify-center">
            <button onClick={goBack} className="absolute left-0 text-sm text-white/80 hover:text-white">← Back</button>
            <div className="text-sm text-white/80">Payment details</div>
          </div>
          <div className="mt-2 border-t border-white/10" />
        </div>
        <div className="flex-1 space-y-2">
          <Shimmer /><Shimmer /><Shimmer />
        </div>
      </div>
    );
  }

  const { goBack, email, payMethod, onContinue, piId } = props;
  const [peReady, setPeReady] = useState(false);
  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const elements = useElements();

  async function validateAndContinue() {
    if (!elements) return;
    setChecking(true); setErr(null);
    const { error } = await elements.submit();
    if (error) { setErr(error.message ?? "Please complete the required payment details."); setChecking(false); return; }
    setChecking(false); onContinue();
  }

  return (
    <div className="h-full flex flex-col rounded-xl p-4 ring-1 ring-white/12 bg-white/[.04]">
      <div className="mb-3">
        <div className="relative h-7 flex items-center justify-center">
          <button onClick={goBack} className="absolute left-0 text-sm text-white/80 hover:text-white">← Back</button>
          <div className="text-sm text-white/80">Payment details</div>
        </div>
        <div className="mt-2 border-t border-white/10" />
      </div>

      <div className="flex-1">
        <div className="relative min-h-[300px]">
          <div className={`transition-opacity duration-150 ${peReady ? "opacity-100" : "opacity-0"}`}>
            <CardForm
              piId={piId}
              email={email}
              activePm={payMethod}
              onElementsReady={() => setPeReady(true)}
            />
          </div>
          {!peReady && (
            <div className="absolute inset-0 space-y-2">
              <Shimmer /><Shimmer /><Shimmer />
            </div>
          )}
        </div>
      </div>

      <div className="mt-3">
        {err && <p className="text-red-400 text-sm mb-2">{err}</p>}
        <button
          onClick={validateAndContinue}
          disabled={!elements || checking}
          className="w-full rounded-xl px-5 py-3 text-base font-semibold text-[#0A0A0A]
                     bg-[#fc8803] hover:bg-[#f8a81a] transition
                     shadow-[0_10px_28px_rgba(245,158,11,.35)]
                     ring-1 ring-[rgba(255,190,80,.55)] disabled:opacity-50"
        >
          {checking ? "Checking…" : "Continue"}
        </button>
      </div>
    </div>
  );
}

function Shimmer() {
  return (
    <div className="relative h-10 rounded-lg ring-1 ring-white/12 bg-white/[0.05] overflow-hidden" aria-busy>
      <div className="absolute inset-0" style={{ background:"linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)", mixBlendMode:"overlay", animation:"shimmer 1.2s linear infinite", transform:"translateX(-100%)" }} />
      <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
    </div>
  );
}
