// app/(legal)/withdrawal/page.tsx
import React from "react";

export const metadata = {
  title: "Withdrawal Policy",
  description: "Right of withdrawal (Widerrufsbelehrung) according to EU consumer law.",
};

export default function WithdrawalPage() {
  return (
    <section className="relative isolate min-h-screen pt-12 md:pt-16 lg:pt-20 pb-14 text-white overflow-x-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none isolate overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#05070f_0%,#070c18_40%,#0c1528_70%,#16264a_100%)]" />
        <div className="absolute inset-0 [mask-image:radial-gradient(80%_80%_at_50%_50%,black,transparent)] bg-black/60" />
      </div>

      <div className="relative z-0 mx-auto w-full max-w-4xl px-6 md:px-8">
        <div
          className="
            relative rounded-2xl p-6 md:p-8
            bg-[linear-gradient(135deg,#11182a_0%,#0e1526_45%,#0c1322_100%)]
            border border-[rgba(146,180,255,0.12)]
            ring-1 ring-[rgba(146,180,255,0.14)]
            shadow-[0_12px_40px_rgba(0,0,0,0.5)]
            space-y-6
          "
        >
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Withdrawal Policy</h1>

          <div className="space-y-6 text-white/90 leading-relaxed">
            {/* Explanation */}
            <h2 className="text-xl font-semibold">Right of Withdrawal</h2>
            <p>
              You have the right to withdraw from this contract within 14 days without giving any reason.
            </p>
            <p>
              The withdrawal period is 14 days from the day of the conclusion of the contract.
            </p>
            <p>
              To exercise your right of withdrawal, you must inform me (
              <span className="font-medium">Tim Bäumler / Sho Coaching</span>) by means of a clear
              statement (e.g. a letter sent by post or email). You may use the model withdrawal form below, but this is
              not obligatory.
            </p>
            <p>
              To meet the withdrawal deadline, it is sufficient that you send your communication concerning your
              exercise of the right of withdrawal before the withdrawal period has expired.
            </p>

            <h2 className="text-xl font-semibold">Consequences of Withdrawal</h2>
            <p>
              If you withdraw from this contract, I shall reimburse you all payments received from you without undue
              delay and at the latest within 14 days from the day on which I receive notification of your withdrawal.
              I will use the same means of payment you used for the original transaction, unless expressly agreed
              otherwise.
            </p>
            <p>
              If you requested that the service should begin during the withdrawal period, you shall pay me an amount
              proportionate to the services provided up to the time you informed me of the exercise of the right of
              withdrawal.
            </p>
            <p>
              If you request that the coaching begins before the end of the withdrawal period and the service is fully
              performed, the right of withdrawal expires (§356(4) BGB).
            </p>

            {/* Model Form */}
            <h2 className="text-xl font-semibold">Model Withdrawal Form</h2>
            <p className="text-white/70 text-sm">
              (complete and return this form only if you wish to withdraw from the contract)
            </p>

            <div className="p-4 bg-black/30 rounded-lg border border-white/10 text-sm leading-relaxed">
              <p>— To Tim Bäumler – Sho Coaching, Emsdettener Straße 18, 48268 Greven, Germany, E-Mail: im.sho@yahoo.com</p>
              <p>
                — I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract of sale of the following
                service (*)
              </p>
              <p>— Ordered on (*) / received on (*)</p>
              <p>— Name of consumer(s)</p>
              <p>— Address of consumer(s)</p>
              <p>— Signature of consumer(s) (only if this form is notified on paper)</p>
              <p>— Date</p>
              <p className="text-xs text-white/50">(*) Delete as appropriate.</p>
            </div>
          </div>

          <p className="text-xs text-white/55 pt-2">Last updated: 29 November 2025</p>
        </div>
      </div>
    </section>
  );
}