// src/app/admin/page.tsx
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const Hub      = dynamic(() => import("./HUB/page"),      { ssr: false });
const Slots    = dynamic(() => import("./availability/page"),    { ssr: false });
const Sessions = dynamic(() => import("./sessions/page"), { ssr: false });
const Students = dynamic(() => import("./students/page"), { ssr: false });

type Tab = "hub" | "slots" | "sessions" | "students";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("hub");

  const TabButton = ({ id, label }: { id: Tab; label: string }) => {
    const active = tab === id;
    return (
      <button
        onClick={() => setTab(id)}
        aria-selected={active}
        className={`px-8 py-4 text-xl font-semibold ring-2 transition
          ${
            active
              ? "bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white ring-white/20 shadow-[0_0_20px_rgba(120,0,255,0.5)]"
              : "bg-black/50 text-white/80 hover:text-white ring-white/15"
          }
          rounded-r-xl`} // only right edge rounded
      >
        {label}
      </button>
    );
  };

  return (
    <>
      {/* Floating vertical buttons on left edge */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed z-50 left-0 top-1/2 -translate-y-1/2 flex flex-col items-stretch gap-3"
      >
        <TabButton id="hub"      label="📊 Hub" />
        <TabButton id="slots"    label="🧙 Slots" />
        <TabButton id="sessions" label="✨ Sessions" />
        <TabButton id="students" label="🎓 Students" />
      </motion.div>

      <div className="pt-6">
        {tab === "hub"      && <Hub />}
        {tab === "slots"    && <Slots />}
        {tab === "sessions" && <Sessions />}
        {tab === "students" && <Students />}
      </div>
    </>
  );
}
