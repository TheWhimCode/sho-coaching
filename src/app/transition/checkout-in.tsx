"use client";
import { motion } from "framer-motion";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function CheckoutIn({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="fixed inset-0 z-[999] bg-transparent"
      initial={{ x: "100%" }}
      animate={{ x: "0%" }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.9, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
