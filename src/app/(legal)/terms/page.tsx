// app/(legal)/terms/page.tsx
import React from "react";

export const metadata = {
  title: "Terms & Conditions",
  description: "General Terms and Conditions (AGB) for services and coaching.",
};

export default function TermsPage() {
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
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Terms & Conditions</h1>

          <div className="space-y-4 text-white/90 leading-relaxed">
            <p className="text-sm uppercase tracking-wider text-white/60">
              General Terms and Conditions (AGB)
            </p>

            <h2 className="text-xl font-semibold">1. Scope</h2>
            <p>
              These Terms & Conditions apply to all contracts concluded between{" "}
              <span className="font-medium">[Your Name / Company]</span> and the customer for coaching and related
              services offered on this website.
            </p>

            <h2 className="text-xl font-semibold">2. Services</h2>
            <p>
              We provide digital coaching sessions, analyses, and related services as described in the booking system.
              The exact scope of services is determined by the booking confirmation.
            </p>

            <h2 className="text-xl font-semibold">3. Conclusion of contract</h2>
            <p>
              By clicking “Pay now” in the checkout, you submit a binding offer. The contract is concluded once you
              receive a booking confirmation via email.
            </p>

            <h2 className="text-xl font-semibold">4. Prices & Payment</h2>
            <p>
              All prices are stated in EUR and include VAT where applicable. Payment is handled securely via our payment
              provider (Stripe, PayPal, etc.).
            </p>

            <h2 className="text-xl font-semibold">5. Right of withdrawal</h2>
            <p>
              Consumers have a statutory right of withdrawal (see{" "}
              <a href="/withdrawal" className="underline decoration-white/40 hover:decoration-white">
                Withdrawal Policy
              </a>
              ).
            </p>

            <h2 className="text-xl font-semibold">6. Performance of services</h2>
            <p>
              Coaching sessions take place at the agreed time via online communication platforms (e.g. Discord). You
              are responsible for providing the necessary technical setup.
            </p>

            <h2 className="text-xl font-semibold">7. Rebooking & cancellation</h2>
            <p>
              Sessions may be rescheduled up to [e.g. 24 hours] before the start without additional charge. Short-notice
              cancellations or no-shows count as performed services.
            </p>

            <h2 className="text-xl font-semibold">8. Liability</h2>
            <p>
              We are liable only for intent and gross negligence. In case of slight negligence, liability exists only
              for damages from injury to life, body, or health, or for breach of essential contractual obligations
              (cardinal duties).
            </p>

            <h2 className="text-xl font-semibold">9. Final provisions</h2>
            <p>
              German law applies. If you are a consumer, this choice of law only applies insofar as it does not deprive
              you of mandatory consumer protection rights of your country of residence. The European Commission provides
              a platform for Online Dispute Resolution (ODR):{" "}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                className="underline decoration-white/40 hover:decoration-white"
                target="_blank"
                rel="noreferrer"
              >
                https://ec.europa.eu/consumers/odr/
              </a>
              .
            </p>
          </div>

          <p className="text-xs text-white/55 pt-2">Last updated: [DD Month YYYY]</p>
        </div>
      </div>
    </section>
  );
}
