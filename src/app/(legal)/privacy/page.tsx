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

          {/* Friendly summary like big companies use */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
            <p className="text-sm uppercase tracking-wider text-white/70">In short</p>
            <ul className="list-disc pl-5 space-y-1 text-white/90">
              <li>I collect only what I need to run your coaching session: your email, your Discord username, and booking/payment details.</li>
              <li>No cookies and no analytics on this site.</li>
              <li>Payments run through Stripe; emails go via Resend; sessions use Discord; the site is hosted on Vercel. Some processing may happen outside the EU with standard safeguards.</li>
              <li>You can ask to access, correct, or delete your data at any time (within legal limits).</li>
            </ul>
          </div>

          <div className="space-y-6 text-white/90 leading-relaxed">
            <p className="text-sm uppercase tracking-wider text-white/60">
              Datenschutzerklärung (GDPR / DSGVO)
            </p>

            <h2 className="text-xl font-semibold">1. Controller</h2>
            <p>
              The controller responsible for processing your personal data is:<br />
              <span className="font-medium">[Your Full Name]</span><br />
              [Your Address]<br />
              E-mail: <span className="font-medium font-semibold">im.sho@yahoo.com</span>
            </p>

            <h2 className="text-xl font-semibold">2. Data We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium">Email address</span> (booking confirmations, communication).</li>
              <li><span className="font-medium">Discord username</span> (to conduct sessions).</li>
              <li><span className="font-medium">Booking &amp; payment info</span> (session type/status, Stripe IDs, payment references, amount, currency).</li>
              <li><span className="font-medium">Notes</span> you optionally provide.</li>
              <li><span className="font-medium">Technical metadata</span> (e.g., IP when accepting the withdrawal waiver—only EU).</li>
              <li><span className="font-medium">Email logs</span> (what was sent and when).</li>
            </ul>
            <p>I do <span className="font-semibold">not</span> use cookies or analytics on this website.</p>

            <h2 className="text-xl font-semibold">3. Purposes &amp; Legal Bases</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium">Contract performance (Art. 6(1)(b) GDPR)</span>: provide and manage coaching, bookings, and payments.</li>
              <li><span className="font-medium">Legitimate interests (Art. 6(1)(f) GDPR)</span>: ensure service security, keep essential records (e.g., email logs), prevent abuse/fraud, improve booking flow.</li>
              <li><span className="font-medium">Legal obligations (Art. 6(1)(c) GDPR)</span>: where applicable (e.g., tax/accounting if invoices are issued).</li>
            </ul>

            <h2 className="text-xl font-semibold">4. Third-Party Processing</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium">Stripe</span> – payment processing (you enter payment details with Stripe; I receive confirmation identifiers).</li>
              <li><span className="font-medium">Resend</span> – transactional emails (e.g., booking confirmations) sent to your email address.</li>
              <li><span className="font-medium">Discord</span> – communication during coaching sessions using your Discord username.</li>
              <li><span className="font-medium">Vercel</span> – website hosting and delivery.</li>
            </ul>
            <p>
              These providers may process data outside the EU/EEA (e.g., in the United States). Transfers rely on applicable safeguards such as the
              European Commission’s <span className="font-medium">Standard Contractual Clauses (SCCs)</span> or equivalent mechanisms.
            </p>

            <h2 className="text-xl font-semibold">5. Retention</h2>
            <p>
              I keep personal data only as long as needed to operate the service and handle potential claims. As a rule of thumb: booking and payment
              records are retained for up to <span className="font-medium">3 years</span> after the last interaction (general limitation period). If legal
              retention duties apply (e.g., for issued invoices), data may be stored for up to <span className="font-medium">10 years</span>. Communication data and notes may be
              kept until you request deletion, unless I must retain them for legal reasons.
            </p>

            <h2 className="text-xl font-semibold">6. Your Rights</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium">Access</span> (Art. 15), <span className="font-medium">Rectification</span> (Art. 16), <span className="font-medium">Erasure</span> (Art. 17), <span className="font-medium">Restriction</span> (Art. 18).</li>
              <li><span className="font-medium">Data portability</span> (Art. 20).</li>
              <li><span className="font-medium">Objection</span> to processing based on legitimate interests (Art. 21).</li>
            </ul>
            <p>
              You also have the right to lodge a complaint with a supervisory authority. In Germany: the{" "}
              <span className="font-medium">BfDI – Bundesbeauftragter für den Datenschutz und die Informationsfreiheit</span>.
            </p>

            <h2 className="text-xl font-semibold">7. International Users</h2>
            <p>
              Services are available worldwide. Regardless of your location, your data is handled per this policy and applicable law.
            </p>

            <h2 className="text-xl font-semibold">8. No Cookies &amp; No Analytics</h2>
            <p>
              This site does not set cookies for tracking/analytics and does not use analytics tools.
            </p>

            <h2 className="text-xl font-semibold">9. Contact</h2>
            <p>
              For privacy inquiries or to exercise your rights, contact: <span className="font-medium font-semibold">im.sho@yahoo.com</span>.
            </p>
          </div>

          <p className="text-xs text-white/55 pt-2">Last updated: [12 09 2025]</p>
        </div>
      </div>
    </section>
  );
}
