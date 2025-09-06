// src/app/admin/page.tsx
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

// Reuse your existing pages as components
const Slots = dynamic(() => import("./slots/page"), { ssr: false });
const Bookings = dynamic(() => import("./bookings/page"), { ssr: false });

type Tab = "slots" | "bookings";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("slots");

  const TabButton = ({ id, label }: { id: Tab; label: string }) => {
    const active = tab === id;
    return (
      <button
        onClick={() => setTab(id)}
        aria-selected={active}
        className={`px-4 py-2 rounded-xl text-sm font-medium ring-1 transition
          ${active
            ? "bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white ring-white/20 shadow-[0_0_15px_rgba(120,0,255,0.4)]"
            : "bg-black/50 text-white/80 hover:text-white ring-white/15"}`}
      >
        {label}
      </button>
    );
  };

  return (
    <>
      {/* Floating tabs bar (kept separate so your child pages can own their layouts/backgrounds) */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed z-50 top-4 left-1/2 -translate-x-1/2 backdrop-blur-md bg-black/30 rounded-2xl p-2 ring-1 ring-white/15 flex gap-2"
      >
        <TabButton id="slots" label="🧙 Slots" />
        <TabButton id="bookings" label="✨ Bookings" />
      </motion.div>

      {/* Only render the active tab (simple; if you want to keep state between tabs,
          render both and toggle with `hidden` instead) */}
      {tab === "slots" ? <Slots /> : <Bookings />}
    </>
  );
}
