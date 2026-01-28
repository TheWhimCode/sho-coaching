// src/app/admin/page.tsx
"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const Hub = dynamic(() => import("./HUB/page"), { ssr: false });
const Slots = dynamic(() => import("./availability/page"), { ssr: false });
const Sessions = dynamic(() => import("./sessions/page"), { ssr: false });
const Students = dynamic(() => import("./students/page"), { ssr: false });

const TABS = ["hub", "slots", "sessions", "students"] as const;
type Tab = (typeof TABS)[number];

function AdminInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : "hub";

  const goTab = (id: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", id);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const TabButton = ({ id, label }: { id: Tab; label: string }) => {
    const active = tab === id;
    return (
      <button
        onClick={() => goTab(id)}
        aria-selected={active}
        className={`px-8 py-4 text-xl font-semibold ring-2 transition
          ${
            active
              ? "bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white ring-white/20 shadow-[0_0_20px_rgba(120,0,255,0.5)]"
              : "bg-black/50 text-white/80 hover:text-white ring-white/15"
          }
          rounded-r-xl`}
      >
        {label}
      </button>
    );
  };

  const MobileTabButton = ({ id, icon }: { id: Tab; icon: string }) => {
    const active = tab === id;
    return (
      <button
        onClick={() => goTab(id)}
        aria-selected={active}
        className={`flex-1 h-12 rounded-xl text-xl ring-1 transition
          ${
            active
              ? "bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white ring-white/30"
              : "text-white/70 ring-white/15 hover:text-white"
          }`}
      >
        {icon}
      </button>
    );
  };

  return (
    <>
      {/* Desktop left dock */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="hidden md:flex fixed z-50 left-0 top-1/2 -translate-y-1/2 flex-col items-stretch gap-3"
      >
        <TabButton id="hub" label="📊 Hub" />
        <TabButton id="slots" label="🧙 Availability" />
        <TabButton id="sessions" label="✨ Sessions" />
        <TabButton id="students" label="🎓 Students" />
      </motion.div>

      {/* Mobile bottom bar */}
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="md:hidden fixed z-50 left-0 right-0 bottom-0 px-3 pb-3"
      >
        <div className="mx-auto max-w-md rounded-2xl ring-1 ring-white/10 bg-black/60 backdrop-blur flex gap-2 p-2">
          <MobileTabButton id="hub" icon="📊" />
          <MobileTabButton id="slots" icon="🧙" />
          <MobileTabButton id="sessions" icon="✨" />
          <MobileTabButton id="students" icon="🎓" />
        </div>
      </motion.div>

      {/* Content */}
      <div className="pt-6 pb-28 md:pb-0 md:pl-28">
        {tab === "hub" && <Hub />}
        {tab === "slots" && <Slots />}
        {tab === "sessions" && <Sessions />}
        {tab === "students" && <Students />}
      </div>
    </>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminInner />
    </Suspense>
  );
}
