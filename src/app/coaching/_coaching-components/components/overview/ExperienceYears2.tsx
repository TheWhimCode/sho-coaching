"use client";

import React from "react";
import { motion } from "framer-motion";

type Props = {
  title?: string;
  subtitle?: string;
  className?: string;
  minHeight?: number;
};

export default function ExperienceYears2({
  title = "5+ Years",
  subtitle = "SoloQ coaching experience",
  className = "",
  minHeight = 168,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.5 }}
      className={`flex h-full flex-col items-center justify-center text-center ${className}`}
      style={{ minHeight }}
    >
      <div className="text-3xl md:text-4xl font-extrabold text-white">
        {title}
      </div>
      <div className="mt-1 text-base md:text-lg text-fg-muted/85">
        {subtitle}
      </div>
    </motion.div>
  );
}
