"use client";

import dynamic from "next/dynamic";
import { Elements } from "@stripe/react-stripe-js";
import { AnimatePresence, motion } from "framer-motion";
import StepContact from "./StepContact";
import StepChoose from "./StepChoose";
const StepPayDetails = dynamic(() => import("./StepPayDetails"), { ssr: false });
import StepSummary from "./StepSummary";
import { useFooter } from "./FooterContext";

export default function CheckoutSteps({
  flow,
}: {
  flow: ReturnType<typeof import("./useCheckoutFlow").useCheckoutFlow>;
}) {
  const [footer] = useFooter();

  const {
    step,
    dir,
    goBack,
    goNext,
    chooseAndGo,
    handleRiotVerified,
    handleDiscordLinked,
    riotTag, setRiotTag, notes, setNotes,
    discordIdentity, clientSecret, piId, payMethod,
    stripePromise, appearance, bookingId, waiver, setWaiver,
    payload, breakdown, sessionBlockTitle,
    setCardPmId, setSavedCard, savedCard,
    loadingIntent,
  } = flow;

  const variants = {
    enter: (d: 1 | -1) => ({ x: d * 40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: 1 | -1) => ({ x: d * -40, opacity: 0 }),
  };

  // FULL HEIGHT container so absolute panes size correctly
  return (
    <div className="relative h-full">
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
            className="absolute inset-0 flex flex-col"
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
            className="absolute inset-0 flex flex-col"
          >
            <div className="flex flex-col flex-1 min-h-0">
              <Elements stripe={stripePromise} options={{ appearance, loader: "never" }}>
                <StepChoose goBack={goBack} onChoose={chooseAndGo as any} />
              </Elements>
            </div>
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
            className="absolute inset-0 flex flex-col"
          >
            {clientSecret ? (
              <div className="flex flex-col flex-1 min-h-0">
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
              </div>
            ) : (
              <div className="flex flex-col flex-1 min-h-0">
                <StepPayDetails
                  mode="loading"
                  goBack={goBack}
                  payMethod={(payMethod || "card") as any}
                  loadingIntent={loadingIntent}
                />
              </div>
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
            className="absolute inset-0 flex flex-col"
          >
            <div className="flex flex-col flex-1 min-h-0">
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
  discordId={discordIdentity?.id ?? ""}        // ✅ new
  discordName={discordIdentity?.username ?? ""} // ✅ new
  notes={notes}
  sessionType={sessionBlockTitle}
  piId={piId}
  waiver={waiver}
  setWaiver={setWaiver}
  clientSecret={clientSecret!}
  cardPmId={null}
  bookingId={bookingId}
/>

              </Elements>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
