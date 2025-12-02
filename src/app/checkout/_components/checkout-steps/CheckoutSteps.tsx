"use client";

import { AnimatePresence, motion } from "framer-motion";
import StepContact from "./StepContact";
import StepChoose from "./StepChoose";
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
    payMethod,
    payload,
    breakdown,
    sessionBlockTitle,
  } = flow;

  const variants = {
    enter: (d: 1 | -1) => ({ x: d * 40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: 1 | -1) => ({ x: d * -40, opacity: 0 }),
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 touch-pan-y">
      <AnimatePresence custom={dir} mode="wait" initial={false}>
        {/* Step 0: Contact */}
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

        {/* Step 1: Choose payment method */}
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
            <StepChoose goBack={goBack} onChoose={chooseAndGo as any} />
          </motion.div>
        )}

        {/* Step 2: Order summary / confirm */}
        {step === 2 && (
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
            <StepSummary
              goBack={goBack}
              payload={{
                baseMinutes: payload.baseMinutes,
                liveBlocks: payload.liveBlocks,
                followups: payload.followups,
                productId: payload.productId,
              }}
              breakdown={breakdown}
              payMethod={(payMethod || "card") as any}
              sessionBlockTitle={sessionBlockTitle}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
