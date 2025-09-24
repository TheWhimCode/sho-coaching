// src/app/admin/page.tsx
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const Slots    = dynamic(() => import("./slots/page"),    { ssr: false });
const Bookings = dynamic(() => import("./bookings/page"), { ssr: false });
const Students = dynamic(() => import("./students/page"), { ssr: false });

type Tab = "slots" | "bookings" | "students";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("slots");

  const TabButton = ({ id, label }: { id: Tab; label: string }) => {
    const active = tab === id;
    return (
      <button
        onClick={() => setTab(id)}
        aria-selected={active}
        className={`px-8 py-4 rounded-xl text-xl font-semibold ring-2 transition
          ${active
            ? "bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white ring-white/20 shadow-[0_0_20px_rgba(120,0,255,0.5)]"
            : "bg-black/50 text-white/80 hover:text-white ring-white/15"}`}
      >
        {label}
      </button>
    );
  };

  return (
    <>
      {/* Vertically centered, left-aligned vertical tabs (3 rows, ~2x size) */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed z-50 left-6 top-1/2 -translate-y-1/2 backdrop-blur-md bg-black/30 rounded-2xl p-3 ring-1 ring-white/15 flex flex-col items-stretch gap-3"
      >
        <TabButton id="slots"    label="🧙 Slots" />
        <TabButton id="bookings" label="✨ Bookings" />
        <TabButton id="students" label="🎓 Students" />
      </motion.div>

      <div className="pt-6">
        {tab === "slots"    && <Slots />}
        {tab === "bookings" && <Bookings />}
        {tab === "students" && <Students />}
      </div>
    </>
  );
}
