import { useState } from "react";
import { Elements, useElements } from "@stripe/react-stripe-js";
import type { Appearance, Stripe } from "@stripe/stripe-js";

import CardForm from "@/components/checkout/CardForm";
import PaymentSkeleton from "@/components/checkout/PaymentSkeleton";
import { ArrowLeft } from "lucide-react";


type Method = "card" | "paypal" | "revolut_pay";

/** ---------- Props (discriminated union) ---------- */

type Common = {
  goBack: () => void;
  payMethod?: Method;
};

type LoadingProps = Common & {
  mode: "loading";
  loadingIntent?: boolean;
  // Stripe props optional in loading mode
  stripePromise?: Promise<Stripe | null>;
  appearance?: Appearance;
  clientSecret?: string | null;
};

type FormProps = Common & {
  mode: "form";
  email: string;
  payMethod: Method;
  onContinue: () => void;
  piId?: string | null;

  // Required in form mode
  stripePromise: Promise<Stripe | null>;
  appearance: Appearance;
  clientSecret: string; // non-null when in "form"
};

type Props = LoadingProps | FormProps;

/** ---------- Component ---------- */

export default function StepPayDetails(props: Props) {
  if (props.mode === "loading") {
    const { goBack, payMethod } = props;

    return (
      <div className="h-full flex flex-col pt-2">
        {/* header */}
        <div className="mb-3">
          <div className="relative h-7 flex items-center justify-center">
            <button
  onClick={goBack}
  className="absolute left-0 inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white"
>
  <ArrowLeft className="w-4 h-4" />
  Back
</button>
            <div className="text-sm text-white/80">Payment details</div>
          </div>
          <div className="mt-2 border-t border-white/10" />
        </div>

        {/* body + pinned footer */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 min-h-[280px]">
            <PaymentSkeleton method={payMethod ?? "card"} />
          </div>

          <div className="mt-auto pt-3 border-t border-white/10">
            <button
              disabled
              className="w-full rounded-xl px-5 py-3 text-base font-semibold text-[#0A0A0A]
                         bg-[#fc8803] transition
                         shadow-[0_10px_28px_rgba(245,158,11,.35)]
                         ring-1 ring-[rgba(255,190,80,.55)]
                         opacity-50"
            >
              Loading…
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- FORM MODE ----
  const {
    goBack,
    email,
    payMethod,
    onContinue,
    piId,
    stripePromise,
    appearance,
    clientSecret,
  } = props;

  return (
    <div className="h-full flex flex-col pt-2">
      {/* header */}
      <div className="mb-3">
        <div className="relative h-7 flex items-center justify-center">
          <button
  onClick={goBack}
  className="absolute left-0 inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white"
>
  <ArrowLeft className="w-4 h-4" />
  Back
</button>
          <div className="text-sm text-white/80">Payment details</div>
        </div>
        <div className="mt-2 border-t border-white/10" />
      </div>

      {/* body + pinned footer */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 relative min-h-[280px]">
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance, loader: "never" }}
          >
            <FormBody
              email={email}
              payMethod={payMethod}
              piId={piId}
              onContinue={onContinue}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
}

/** ---------- Inner form body (inside <Elements>) ---------- */

function FormBody({
  email,
  payMethod,
  piId,
  onContinue,
}: {
  email: string;
  payMethod: Method;
  piId?: string | null;
  onContinue: () => void;
}) {
  const elements = useElements();
  const [peReady, setPeReady] = useState(false);
  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
    <div className="flex flex-col h-full">
      {/* layered real form + skeleton */}
      <div className="relative flex-1 min-h-[280px]">
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

      {/* pinned footer identical to StepSummary (but without legal notice) */}
      <div className="mt-auto pt-3 border-t border-white/10">
        {err && <p className="text-red-400 text-sm mb-2">{err}</p>}
        <button
          onClick={validateAndContinue}
          disabled={!elements || checking || !peReady}
          className="w-full rounded-xl px-5 py-3 text-base font-semibold text-[#0A0A0A]
                     bg-[#fc8803] hover:bg-[#f8a81a] transition
                     shadow-[0_10px_28px_rgba(245,158,11,.35)]
                     ring-1 ring-[rgba(255,190,80,.55)]
                     disabled:opacity-50"
        >
          {checking ? "Checking…" : "Continue"}
        </button>
      </div>
    </div>
  );
}
