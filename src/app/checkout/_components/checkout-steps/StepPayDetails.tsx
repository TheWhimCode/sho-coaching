"use client";

import { useState, useEffect, useRef } from "react";
import { useElements, useStripe, CardNumberElement } from "@stripe/react-stripe-js";

import CardForm from "@/app/checkout/_components/checkout-steps/step-components/CardForm";
import PaymentSkeleton from "@/app/checkout/_components/checkout-steps/step-components/PaymentSkeleton";
import { ArrowLeft, CreditCard } from "lucide-react";
import { useFooter } from "@/app/checkout/_components/checkout-steps/FooterContext";

type Method = "card" | "paypal" | "revolut_pay" | "klarna";

type SavedCard = {
  id: string;
  brand: string | null;
  last4: string | null;
  exp_month: number | null;
  exp_year: number | null;
};

type Common = { goBack: () => void; payMethod?: Method };
type LoadingProps = Common & { mode: "loading"; loadingIntent?: boolean };
type FormProps = Common & {
  mode: "form";
  payMethod: Method;
  onContinue: () => void;
  piId?: string | null;

  setCardPmId: (id: string) => void;
  setSavedCard: (c: SavedCard | null) => void;
  savedCard: SavedCard | null;
};

type Props = LoadingProps | FormProps;

export default function StepPayDetails(props: Props) {
  const [, setFooter] = useFooter();

  // Handle footer for loading state
  useEffect(() => {
    if (props.mode === "loading") {
      setFooter({
        label: "Loading…",
        disabled: true,
        loading: true,
        onClick: undefined,
        hidden: false,
      });
    }
  }, [props.mode, setFooter]);

  if (props.mode === "loading") {
    const { goBack, payMethod } = props;

    return (
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="mb-3">
          <div className="relative h-7 flex items-center justify-center">
            <button
              type="button"
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

        {/* Body (Skeleton) */}
        <div className="flex-1 min-h-0 px-1 flex flex-col">
          <div className="relative min-h-[260px]">
            {/* Invisible placeholder to preserve layout */}
            <div className="opacity-0 pointer-events-none">
              <PaymentSkeleton method={(payMethod ?? "card") as Method} />
            </div>
            {/* Visible skeleton overlay */}
            <div className="absolute inset-0">
              <PaymentSkeleton method={(payMethod ?? "card") as Method} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- FORM MODE ----
  const { goBack, payMethod, onContinue, piId, setCardPmId, setSavedCard, savedCard } = props;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-3">
        <div className="relative h-7 flex items-center justify-center">
          <button
            type="button"
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

      {/* Body (Form) */}
      <div className="flex-1 min-h-0 px-1 flex flex-col">
        <FormBody
          payMethod={payMethod}
          piId={piId}
          onContinue={onContinue}
          setCardPmId={setCardPmId}
          setSavedCard={setSavedCard}
          savedCard={savedCard}
        />
      </div>
    </div>
  );
}

/** ---------- Inner form body (uses parent <Elements> context) ---------- */
function FormBody({
  payMethod,
  piId,
  onContinue,
  setCardPmId,
  setSavedCard,
  savedCard,
}: {
  payMethod: Method;
  piId?: string | null;
  onContinue: () => void;
  setCardPmId: (id: string) => void;
  setSavedCard: (c: SavedCard | null) => void;
  savedCard: SavedCard | null;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [showSkeleton, setShowSkeleton] = useState(true);
  const readyLocked = useRef(false);

  useEffect(() => {
    if (payMethod === "card" && savedCard) {
      setShowSkeleton(false);
    } else {
      setShowSkeleton(true);
      readyLocked.current = false;
    }
  }, [payMethod, savedCard]);

  const [checking, setChecking] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [, setFooter] = useFooter();
  const formRef = useRef<HTMLFormElement>(null);

  // Publish footer state
  useEffect(() => {
    const disabled = !stripe || showSkeleton || checking;
    setFooter({
      label: checking ? "Checking…" : "Continue",
      disabled,
      loading: checking,
      onClick: () => formRef.current?.requestSubmit(),
      hidden: false,
    });
  }, [setFooter, stripe, showSkeleton, checking]);

  async function validateAndContinue() {
    if (!stripe) return;
    setSubmitted(true);
    setChecking(true);
    setErr(null);

    if (payMethod === "card") {
      if (savedCard?.id) {
        setChecking(false);
        onContinue();
        return;
      }
      if (!elements) {
        setErr("Payment form not ready.");
        setChecking(false);
        return;
      }
      const card = elements.getElement(CardNumberElement);
      if (!card) {
        setErr("Card field not ready.");
        setChecking(false);
        return;
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card,
      });

      if (error || !paymentMethod) {
        setErr(error?.message ?? "Please complete the card details.");
        setChecking(false);
        return;
      }

      setCardPmId(paymentMethod.id);
      setSavedCard({
        id: paymentMethod.id,
        brand: paymentMethod.card?.brand ?? null,
        last4: paymentMethod.card?.last4 ?? null,
        exp_month: paymentMethod.card?.exp_month ?? null,
        exp_year: paymentMethod.card?.exp_year ?? null,
      });

      setChecking(false);
      onContinue();
      return;
    }

    // Non-card methods
    if (!elements) {
      setErr("Payment form not ready.");
      setChecking(false);
      return;
    }
    const { error } = await elements.submit();
    if (error) {
      setErr(error.message ?? "Please complete the required payment details.");
      setChecking(false);
      return;
    }

    setChecking(false);
    onContinue();
  }

  function SavedCardPanel() {
    if (!savedCard) return null;

    const brand = savedCard.brand ? savedCard.brand.toUpperCase() : "CARD";
    const last4 = savedCard.last4 ?? "••••";
    const exp =
      savedCard.exp_month && savedCard.exp_year
        ? `${String(savedCard.exp_month).padStart(2, "0")}/${String(savedCard.exp_year).slice(-2)}`
        : null;

    return (
      <div
        className="
          relative rounded-xl p-4
          bg-[linear-gradient(140deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]
          ring-1 ring-white/12
          shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02),0_10px_30px_rgba(0,0,0,0.25)]
        "
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/[.08] flex items-center justify-center ring-1 ring-white/10">
              <CreditCard className="w-[18px] h-[18px] text-white/85" />
            </div>

            <div className="leading-tight">
              <div className="text-white/90 font-semibold tracking-wide">•••• {last4}</div>
              <div className="text-xs text-white/65">
                {brand}
                {exp ? ` · exp ${exp}` : ""}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSavedCard(null);
              setShowSkeleton(true);
              readyLocked.current = false;
            }}
            className="
              inline-flex items-center gap-1.5
              text-sm font-medium
              px-3 py-1.5 rounded-lg
              bg-white/5 hover:bg-white/8
              ring-1 ring-white/12
              text-white/85 hover:text-white
              transition
            "
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      noValidate
      onKeyDownCapture={(e) => {
        if (e.key === "Enter" && (e.target as HTMLElement)?.tagName !== "TEXTAREA") {
          e.preventDefault();
        }
      }}
      className="flex flex-col flex-1 min-h-0"
      onSubmit={(e) => {
        e.preventDefault();
        if (!checking) validateAndContinue();
      }}
    >
      <div className="flex-1 min-h-0 relative">
        <div className={`relative ${payMethod === "card" && !savedCard ? "min-h-[330px]" : "min-h-0"}`}>
          {/* Fade-in content */}
          <div
            className={`transition-opacity duration-150 ${
              showSkeleton ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            {payMethod === "card" ? (
              savedCard ? (
                <SavedCardPanel />
              ) : (
                <CardForm
                  activePm="card"
                  submitted={submitted}
                  onPaymentChange={() => {}}
                  onElementsReady={() => {
                    if (!readyLocked.current) {
                      readyLocked.current = true;
                      setShowSkeleton(false);
                    }
                  }}
                />
              )
            ) : (
              <CardForm
                activePm={payMethod}
                onElementsReady={() => {
                  if (!readyLocked.current) {
                    readyLocked.current = true;
                    setShowSkeleton(false);
                  }
                }}
              />
            )}
          </div>

          {/* Skeleton overlay */}
          {showSkeleton && (
            <div className="absolute inset-0">
              <PaymentSkeleton method={payMethod} />
            </div>
          )}
        </div>
      </div>

      {err && <p className="sr-only">{err}</p>}
    </form>
  );
}
