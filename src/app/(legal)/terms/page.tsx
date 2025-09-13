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
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Terms &amp; Conditions</h1>

          {/* At-a-glance summary */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
            <p className="text-sm uppercase tracking-wider text-white/70">In short</p>
            <ul className="list-disc pl-5 space-y-1 text-white/90">
              <li>Paid 1:1 coaching via Discord, booked on this site and paid in advance via Stripe.</li>
              <li>Reschedule/cancel free of charge up to 24h before start; after that, no refunds. I may make exceptions at my discretion.</li>
              <li>No guarantees of rank or performance outcomes. I give advice, you apply it.</li>
              <li>You’re responsible for your own setup (internet, Discord, mic).</li>
              <li>Materials I share remain my IP; you can use/share them for personal, non-commercial purposes.</li>
            </ul>
          </div>

          <div className="space-y-6 text-white/90 leading-relaxed">
            <p className="text-sm uppercase tracking-wider text-white/60">General Terms and Conditions (AGB)</p>

            <h2 className="text-xl font-semibold">1. Scope &amp; Parties</h2>
            <p>
              These Terms &amp; Conditions apply to all contracts for coaching services offered on this website between{" "}
              <span className="font-medium">[Your Full Name] / Sho Coaching</span> (“I”, “me”) and you as the customer.
              Any deviating terms require my written agreement.
            </p>

            <h2 className="text-xl font-semibold">2. Services</h2>
            <p>
              I currently offer <span className="font-medium">paid online coaching sessions</span> (e.g., gameplay review,
              live coaching) delivered via Discord. The exact scope, duration and price are as shown in the booking flow
              and the booking confirmation.
            </p>

            <h2 className="text-xl font-semibold">3. Booking &amp; Contract Formation</h2>
            <p>
              By completing checkout you submit a binding offer to purchase a session. A contract is concluded when you
              receive my booking confirmation email.
            </p>

            <h2 className="text-xl font-semibold">4. Prices &amp; Payment</h2>
            <p>
              Prices are shown in EUR. According to §19 UStG (Kleinunternehmerregelung), no VAT is charged. Payment is due in advance via{" "}
              <span className="font-medium">Stripe</span> (Stripe Elements). Services begin only after successful payment.
            </p>

            <h2 className="text-xl font-semibold">5. Rescheduling, Cancellation &amp; Refunds</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                You may reschedule or cancel <span className="font-medium">up to 24 hours</span> before the scheduled start
                without additional charge.
              </li>
              <li>
                If you cancel later than 24 hours before start, arrive late by more than 15 minutes, or do not attend,
                the session is deemed performed and the <span className="font-medium">full fee remains due</span>;{" "}
                <span className="font-medium">no refund</span> is provided.
              </li>
              <li>
                I may, at my <span className="font-medium">sole discretion</span>, offer a refund or rescheduling even
                if the above conditions are not met.
              </li>
              <li>
                If I must cancel for reasons within my control, you may choose between a refund or a new appointment.
              </li>
            </ul>

            <h2 className="text-xl font-semibold">6. Customer Obligations (Technical &amp; Conduct)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Ensure a working setup <span className="font-medium">before</span> the session: stable internet, a functioning
                microphone/headset, Discord account, and access to any required game clients.
              </li>
              <li>
                Maintain respectful conduct. I may refuse or terminate a session in cases of harassment, hate speech,
                or other inappropriate behavior; Section 5 applies to fees.
              </li>
              <li>
                Age: You must be <span className="font-medium">18+</span> or have verifiable{" "}
                <span className="font-medium">parental/guardian consent</span> if you are 16–17. I do not contract with persons
                under 16.
              </li>
            </ul>

            <h2 className="text-xl font-semibold">7. Intellectual Property &amp; Session Materials</h2>
            <p>
              Any materials I provide (e.g., session recordings, notes, graphics, documents) remain my{" "}
              <span className="font-medium">intellectual property</span>. I grant you a{" "}
              <span className="font-medium">non-exclusive, non-transferable, royalty-free</span> license to use and share
              these materials for <span className="font-medium">personal, non-commercial</span> purposes. Any commercial use,
              public posting/redistribution outside normal personal sharing, or removal of attributions requires my prior
              written consent.
            </p>

            <h2 className="text-xl font-semibold">8. No Guarantee of Outcomes</h2>
            <p>
              Coaching provides advice and training, but results depend on many factors beyond my control. I make{" "}
              <span className="font-medium">no guarantees</span> regarding rank, win rate, or other performance outcomes, and
              I am not responsible for negative in-game results. 
            </p>

            <h2 className="text-xl font-semibold">9. Availability of Third-Party Services</h2>
            <p>
              Coaching sessions rely on third-party platforms (e.g., Discord, game servers, payment providers). I am not liable
              for outages or limitations of such services. If a session cannot proceed due to a platform outage, I will
              reschedule at no cost.
            </p>

            <h2 className="text-xl font-semibold">10. Liability</h2>
            <p>
              I am liable without limitation for intent and gross negligence and for injury to life, body, or health.
              For slight negligence, liability exists only for breach of essential contractual obligations (cardinal duties),
              and then limited to the foreseeable, typical damage. Mandatory statutory liability remains unaffected.
            </p>

            <h2 className="text-xl font-semibold">11. Termination / Refusal of Service</h2>
            <p>
              I may refuse or terminate services for justified reasons (e.g., abuse, non-payment, violation of these
              Terms). Fees follow Section 5.
            </p>

            <h2 className="text-xl font-semibold">12. Right of Withdrawal (Consumers)</h2>
            <p>
              Consumers may have a statutory right of withdrawal. Details and the waiver for early performance of digital
              services are provided here:{" "}
              <a
                href="/withdrawal"
                className="underline decoration-white/40 hover:decoration-white"
              >
                Withdrawal Information / Waiver
              </a>.
            </p>

            <h2 className="text-xl font-semibold">13. Contract Language</h2>
            <p>
              The contract language is <span className="font-medium">English</span>.
            </p>

            <h2 className="text-xl font-semibold">14. Governing Law &amp; Dispute Resolution</h2>
            <p>
              German law applies. If you are a consumer, mandatory protections of your habitual residence remain unaffected.
              The European Commission provides an Online Dispute Resolution (ODR) platform:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-white/40 hover:decoration-white"
              >
                https://ec.europa.eu/consumers/odr/
              </a>.
            </p>

            <h2 className="text-xl font-semibold">15. Contact</h2>
            <p>
              Sho Coaching – [Your Full Name]<br />
              [Your Address] • im.sho@yahoo.com
            </p>
          </div>

          <p className="text-xs text-white/55 pt-2">Last updated: [DD Month YYYY]</p>
        </div>
      </div>
    </section>
  );
}
