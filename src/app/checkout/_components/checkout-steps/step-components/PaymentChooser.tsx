"use client";

import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import { useStripe } from "@stripe/react-stripe-js";

export type PayMethod = "card" | "paypal" | "revolut_pay" | "klarna" | "wallet";

type Props =
  | {
      /** chooser mode: only show badges and call onChoose */
      mode: "choose";
      onChoose: (m: PayMethod) => void;
    }
  | never;

/** Lightweight availability probe for Apple/Google Pay */
function useWalletsAvailable(currency: string = "eur") {
  const stripe = useStripe();
  const [available, setAvailable] = React.useState(false);

  React.useEffect(() => {
    if (!stripe) return;
    const pr = stripe.paymentRequest({
      country: "DE",
      currency,
      total: { label: "Checkout", amount: 100 }, // any positive amount for probing
      requestPayerEmail: true,
    });
    pr.canMakePayment().then((res) => setAvailable(!!res));
  }, [stripe, currency]);

  return available;
}

type Row = { key: PayMethod; label: string; sub: string; img: string; alt: string };

export default function PaymentChooser(props: Props) {
  const walletsAvailable = useWalletsAvailable("eur");

  // build rows imperatively
  const rows: Row[] = React.useMemo(() => {
    const list: Row[] = [
      { key: "card",        label: "Card", sub: "Credit & debit cards",                     img: "/images/payment/Card.png",    alt: "Card payment" },
      { key: "paypal",      label: "PayPal",      sub: "Pay with your PayPal account",         img: "/images/payment/Paypal.png",  alt: "PayPal" },
      { key: "revolut_pay", label: "Revolut Pay", sub: "Pay with your Revolut account",        img: "/images/payment/Revolut.svg", alt: "Revolut Pay" },
      { key: "klarna",      label: "Klarna",      sub: "Pay later or in parts with Klarna",                img: "/images/payment/Klarna.png",  alt: "Klarna" },
    ];
    if (walletsAvailable) {
      // insert wallet after card for visibility
      list.splice(1, 0, {
        key: "wallet",
        label: "Apple / Google Pay",
        sub: "Fast checkout with your device wallet",
        img: "/images/payment/Wallets.png",
        alt: "Apple/Google Pay",
      });
    }
    return list;
  }, [walletsAvailable]);

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
