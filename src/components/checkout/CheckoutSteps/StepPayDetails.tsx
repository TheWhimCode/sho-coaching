import { useState } from "react";
import { useElements } from "@stripe/react-stripe-js";

import CardForm from "@/components/checkout/CardForm";
import PaymentSkeleton from "@/components/checkout/PaymentSkeleton";

type Method = "card" | "paypal" | "revolut_pay";

type Props =
  | {
      mode: "loading";
      goBack: () => void;
      loadingIntent: boolean;
      payMethod?: Method;
    }
  | {
      mode: "form";
      goBack: () => void;
      email: string;
      payMethod: Method;
      onContinue: () => void;
      piId?: string | null;
    };

export default function StepPayDetails(props: Props) {
  const isLoading = props.mode === "loading";

  // -------- LOADING --------
  if (isLoading) {
    const { goBack, payMethod } = props;

    return (
      <div className="h-full flex flex-col rounded-xl p-4 bg-transparent">
        {/* header */}
        <div className="mb-3">
          <div className="relative h-7 flex items-center justify-center">
            <button
              onClick={goBack}
              className="absolute left-0 text-sm text-white/80 hover:text-white"
            >
              ← Back
            </button>
            <div className="text-sm text-white/80">Payment details</div>
          </div>
          <div className="mt-2 border-t border-white/10" />
        </div>

        {/* delegate to skeleton */}
        <div className="flex-1">
          <PaymentSkeleton method={payMethod ?? "card"} />
        </div>

        {/* footer: button always shown, disabled */}
        <div className="mt-3">
          <button
            disabled
            className="w-full rounded-xl px-5 py-3 text-base font-semibold text-[#0A0A0A] bg-[#fc8803] transition shadow-[0_10px_28px_rgba(245,158,11,.35)] ring-1 ring-[rgba(255,190,80,.55)] opacity-50"
          >
            Loading…
          </button>
        </div>
      </div>
    );
  }

  // -------- FORM --------
  const { goBack, email, payMethod, onContinue, piId } = props;
  const [peReady, setPeReady] = useState(false);
  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const elements = useElements();

  async function validateAndContinue() {
    if (!elements) return;
    setChecking(true);
    setErr(null);

    const { error } = await elements.submit();
    if (error) {
      setErr(error.message ?? "Please complete the required payment details.");
      setChecking(false);
      return;
    }

    setChecking(false);
    onContinue();
  }

  return (
    <div className="h-full flex flex-col rounded-xl p-4 bg-transparent">
      {/* header */}
      <div className="mb-3">
        <div className="relative h-7 flex items-center justify-center">
          <button
            onClick={goBack}
            className="absolute left-0 text-sm text-white/80 hover:text-white"
          >
            ← Back
          </button>
          <div className="text-sm text-white/80">Payment details</div>
        </div>
        <div className="mt-2 border-t border-white/10" />
      </div>

      {/* body */}
      <div className="flex-1">
        <div className="relative">
          {/* Real elements */}
          <div
            className={`absolute inset-0 transition-opacity duration-150 ${
              peReady ? "opacity-100" : "opacity-0"
            }`}
          >
            <CardForm
              piId={piId}
              email={email}
              activePm={payMethod}
              onElementsReady={() => setPeReady(true)}
            />
          </div>

          {/* Skeleton overlay */}
          <div
            className={`absolute inset-0 transition-opacity duration-150 ${
              peReady ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            <PaymentSkeleton method={payMethod} />
          </div>
        </div>
      </div>

      {/* footer */}
      <div className="mt-3">
        {err && <p className="text-red-400 text-sm mb-2">{err}</p>}
        <button
          onClick={validateAndContinue}
          disabled={!elements || checking || !peReady}
          className="w-full rounded-xl px-5 py-3 text-base font-semibold text-[#0A0A0A] bg-[#fc8803] hover:bg-[#f8a81a] transition shadow-[0_10px_28px_rgba(245,158,11,.35)] ring-1 ring-[rgba(255,190,80,.55)] disabled:opacity-50"
        >
          {checking ? "Checking…" : "Continue"}
        </button>
      </div>
    </div>
  );
}
