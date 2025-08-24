"use client";

import { AnimatePresence, motion } from "framer-motion";

type PayMethod = "card" | "paypal" | "revolut_pay";

type Props =
  | {
      /** chooser mode: only show badges and call onChoose */
      mode: "choose";
      onChoose: (m: PayMethod) => void;
    }
  | never;

export default function PaymentChooser(props: Props) {
  // simple badge list
  const rows: Array<{ key: PayMethod; label: string; sub: string; img: string; alt: string }> = [
    { key: "card",        label: "Pay by card", sub: "Visa, Mastercard, Apple/Google Pay", img: "/images/payment/Card.png",        alt: "Card payment" },
    { key: "paypal",      label: "PayPal",      sub: "Pay with your PayPal account",       img: "/images/payment/Paypal.png",      alt: "PayPal" },
    { key: "revolut_pay", label: "Revolut Pay", sub: "Pay with Revolut account",           img: "/images/payment/Revolut.svg",  alt: "Revolut Pay" },
  ];

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="grid gap-3"
        >
          {rows.map(r => (
            <button
              key={r.key}
              onClick={() => props.mode === "choose" && props.onChoose(r.key)}
              className="flex items-center justify-between rounded-xl px-4 py-3 bg-white/[.05] hover:bg-white/[.08] ring-1 ring-white/12 text-left transition"
            >
              <div className="flex items-center gap-3">
                <img src={r.img} alt={r.alt} className="h-6 w-12 object-contain" />
                <div>
                  <div className="text-sm font-semibold text-white/90">{r.label}</div>
                  <div className="text-xs text-white/60">{r.sub}</div>
                </div>
              </div>
              <span className="text-white/60">›</span>
            </button>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
