// app/(legal)/privacy/page.tsx
import React from "react";

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy (Datenschutzerklärung) under GDPR / DSGVO.",
};

export default function PrivacyPage() {
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
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Privacy Policy</h1>

          <div className="space-y-4 text-white/90 leading-relaxed">
            <p className="text-sm uppercase tracking-wider text-white/60">Datenschutzerklärung (GDPR / DSGVO)</p>

            <h2 className="text-xl font-semibold">1. Controller</h2>
            <p>
              Responsible for data processing: <br />
              <span className="font-medium">[Your Name / Company]</span>, [Address], E-mail: [Email].
            </p>

            <h2 className="text-xl font-semibold">2. Data collection</h2>
            <p>
              We process personal data that you provide during booking (e.g. name, email, Discord ID) as well as payment
              information handled securely by our payment provider (Stripe / PayPal).
            </p>

            <h2 className="text-xl font-semibold">3. Purpose of processing</h2>
            <p>
              Data is processed for contract performance (Art. 6 (1) b GDPR), legal obligations (Art. 6 (1) c GDPR), and
              legitimate interests such as IT security (Art. 6 (1) f GDPR).
            </p>

            <h2 className="text-xl font-semibold">4. Data storage</h2>
            <p>
              We store your data only as long as necessary for contract fulfillment and statutory retention periods
              (e.g. tax law).
            </p>

            <h2 className="text-xl font-semibold">5. Third parties</h2>
            <p>
              Payment data is processed exclusively by our payment providers. Communication during coaching takes place
              via Discord or similar platforms. Their respective privacy policies apply.
            </p>

            <h2 className="text-xl font-semibold">6. Your rights</h2>
            <p>
              You have the right to request access, rectification, erasure, restriction, data portability, and to object
              to processing (Art. 15–21 GDPR). You also have the right to lodge a complaint with a supervisory authority
              (Art. 77 GDPR).
            </p>

            <h2 className="text-xl font-semibold">7. Cookies & analytics</h2>
            <p>
              If we use cookies or analytics (e.g. Google Analytics), this will be disclosed and only activated with
              your consent (Art. 6 (1) a GDPR).
            </p>

            <h2 className="text-xl font-semibold">8. Contact</h2>
            <p>
              For privacy inquiries, contact us at: [Your contact email].
            </p>
          </div>

          <p className="text-xs text-white/55 pt-2">Last updated: [DD Month YYYY]</p>
        </div>
      </div>
    </section>
  );
}
