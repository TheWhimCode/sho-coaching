// src/app/checkout/_components/checkout-steps/step-components/PaymentChooser.tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";

export type PayMethod = "card" | "paypal" | "revolut_pay" | "klarna";

type Props =
  | {
      /** chooser mode: only show badges and call onChoose */
      mode: "choose";
      onChoose: (m: PayMethod) => void;
    }
  | never;

type Row = { key: PayMethod; label: string; sub: string; img: string; alt: string };

export default function PaymentChooser(props: Props) {
  const rows: Row[] = React.useMemo(
    () => [
      {
        key: "card",
        label: "Card",
        sub: "Credit & debit cards",
        img: "/images/payment/Card.png",
        alt: "Card payment",
      },
      {
        key: "paypal",
        label: "PayPal",
        sub: "Pay with your PayPal account",
        img: "/images/payment/Paypal.png",
        alt: "PayPal",
      },
      {
        key: "revolut_pay",
        label: "Revolut Pay",
        sub: "Pay with your Revolut account",
        img: "/images/payment/Revolut.svg",
        alt: "Revolut Pay",
      },
      {
        key: "klarna",
        label: "Klarna",
        sub: "Pay later or in parts with Klarna",
        img: "/images/payment/Klarna.png",
        alt: "Klarna",
      },
    ],
    []
  );

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="grid gap-3"
        >
          {rows.map((r) => (
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
