// src/app/checkout/_components/checkout-steps/CheckoutSteps.tsx
"use client";

import dynamic from "next/dynamic";
import { Elements } from "@stripe/react-stripe-js";
import { AnimatePresence, motion } from "framer-motion";
import StepContact from "./StepContact";
import StepChoose from "./StepChoose";
const StepPayDetails = dynamic(() => import("./StepPayDetails"), { ssr: false });
import StepSummary from "./StepSummary";

export default function CheckoutSteps({
  flow,
}: {
  flow: ReturnType<typeof import("./useCheckoutFlow").useCheckoutFlow>;
}) {
  const {
    step,
    dir,
    goBack,
    goNext,
    chooseAndGo,
    handleRiotVerified,
    handleDiscordLinked,
    riotTag,
    setRiotTag,
    notes,
    setNotes,
    discordIdentity,
    clientSecret,
    piId,
    payMethod,
    stripePromise,
    appearance,
    payload,
    breakdown,
    sessionBlockTitle,
    setCardPmId,
    setSavedCard,
    savedCard,
    loadingIntent,
  } = flow;

  const variants = {
    enter: (d: 1 | -1) => ({ x: d * 40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: 1 | -1) => ({ x: d * -40, opacity: 0 }),
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 touch-pan-y">
      <AnimatePresence custom={dir} mode="wait" initial={false}>
        {step === 0 && (
          <motion.div
            key="step-contact"
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex flex-col"
          >
            <StepContact
              riotTag={riotTag}
              notes={notes}
              setRiotTag={setRiotTag}
              setNotes={setNotes}
              onDiscordLinked={handleDiscordLinked}
              onRiotVerified={handleRiotVerified}
              discordIdentity={discordIdentity}
              contactErr={null}
              riotInputRef={{ current: null }}
              onSubmit={goNext}
            />
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step-choose"
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex flex-col"
          >
            <Elements stripe={stripePromise} options={{ appearance, loader: "never" }}>
              <StepChoose goBack={goBack} onChoose={chooseAndGo as any} />
            </Elements>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step-2"
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex flex-col"
          >
            {clientSecret ? (
              <Elements
                key={clientSecret || "loading-step2"}
                stripe={stripePromise}
                options={{ clientSecret, appearance, loader: "never" }}
              >
                <StepPayDetails
                  mode="form"
                  goBack={goBack}
                  payMethod={(payMethod || "card") as any}
                  onContinue={goNext}
                  piId={piId}
                  setCardPmId={setCardPmId}
                  setSavedCard={setSavedCard}
                  savedCard={savedCard}
                />
              </Elements>
            ) : (
              <StepPayDetails
                mode="loading"
                goBack={goBack}
                payMethod={(payMethod || "card") as any}
                loadingIntent={loadingIntent}
              />
            )}
          </motion.div>
        )}

        {step === 3 && clientSecret && (
          <motion.div
            key="step-summary"
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex flex-col"
          >
            <Elements
              key={clientSecret || "loading-step3"}
              stripe={stripePromise}
              options={{ clientSecret, appearance, loader: "never" }}
            >
              <StepSummary
                goBack={goBack}
                payload={payload}
                breakdown={breakdown}
                payMethod={(payMethod || "card") as any}
                clientSecret={clientSecret!}
              />
            </Elements>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
