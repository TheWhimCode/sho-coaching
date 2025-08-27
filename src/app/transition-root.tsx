"use client";

import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import CheckoutIn from "@/app/transition/checkout-in";

export default function TransitionRoot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      {pathname?.startsWith("/checkout") ? (
        <CheckoutIn key={pathname}>{children}</CheckoutIn>
      ) : (
        <div key={pathname}>{children}</div>
      )}
    </AnimatePresence>
  );
}
