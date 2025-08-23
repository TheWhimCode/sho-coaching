"use client";

export default function UsefulToKnow() {
  return (
    <aside className="relative rounded-2xl p-6 md:p-7 backdrop-blur-md bg-[#0B1220]/80 ring-1 ring-[rgba(146,180,255,.18)]">
      <div className="mb-3">
        <div className="text-xs uppercase tracking-wider text-[#8FB8E6]/90">Before you pay</div>
        <h2 className="mt-1 font-bold text-2xl text-white">Useful to know</h2>
      </div>

      <ul className="space-y-4 text-[15px] text-white/90">
        <li className="flex gap-3">
          <ShieldIcon className="mt-0.5 text-[#8FB8E6]" />
          <div>
            <div className="font-semibold">Refunds & Rescheduling</div>
            <p className="text-white/70 text-sm">Free reschedule up to 24h before the session. Full refunds if I have to cancel.</p>
          </div>
        </li>
        <li className="flex gap-3">
          <ClockIcon className="mt-0.5 text-[#8FB8E6]" />
          <div>
            <div className="font-semibold">What happens next?</div>
            <p className="text-white/70 text-sm">You&apos;ll get an email confirmation with the booking details and a Discord add within a few hours.</p>
          </div>
        </li>
        <li className="flex gap-3">
          <InfoIcon className="mt-0.5 text-[#8FB8E6]" />
          <div>
            <div className="font-semibold">Privacy</div>
            <p className="text-white/70 text-sm">Payments are processed by Stripe/PayPal. I never see your full card details.</p>
          </div>
        </li>
      </ul>

      <p className="mt-5 text-[13px] text-white/60">Questions? DM me on Discord or reply to the confirmation email.</p>

      <span className="pointer-events-none absolute -inset-3 -z-10 rounded-[24px] opacity-20 blur-2xl bg-[radial-gradient(70%_50%_at_0%_0%,_rgba(148,182,255,.25),_transparent_60%)]" />
    </aside>
  );
}

function InfoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 10v7M12 7.5h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function ShieldIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" {...props}>
      <path d="M12 3l7 3v5c0 4.5-3.1 8.2-7 9-3.9-.8-7-4.5-7-9V6l7-3Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
