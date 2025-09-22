"use client";

import { motion } from "framer-motion";

export default function Tagline() {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-[50vh] text-center">
      <motion.h2
        initial={{ opacity: 0.4 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ margin: "0px 0px -5% 0px" }} // ~20% from bottom
        className="text-3xl md:text-5xl font-bold text-white"
      >
        Everyone wants to rank up.
      </motion.h2>

      <motion.h2
        initial={{ opacity: 0.4 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ margin: "0px 0px -45% 0px" }} // ~40% from bottom
        className="mt-4 text-3xl md:text-5xl font-bold text-white"
      >
        Few actually know how.
      </motion.h2>
    </section>
  );
}
