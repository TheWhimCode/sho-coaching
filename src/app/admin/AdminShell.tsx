"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const TABS = [
  { id: "hub", label: "📊 Hub", href: "/admin/HUB", match: (p: string) => p === "/admin" || /^\/admin\/hub$/i.test(p) },
  {
    id: "slots",
    label: "🕐 Availability",
    href: "/admin/availability",
    match: (p: string) => p.startsWith("/admin/availability"),
  },
  {
    id: "sessions",
    label: "📅 Sessions",
    href: "/admin/sessions",
    match: (p: string) => p.startsWith("/admin/sessions"),
  },
  {
    id: "students",
    label: "🎓 Students",
    href: "/admin/students",
    match: (p: string) => p.startsWith("/admin/students"),
  },
  {
    id: "skillcheck",
    label: "⚡ Skillcheck",
    href: "/admin/skillcheck",
    match: (p: string) => p.startsWith("/admin/skillcheck"),
  },
] as const;

function activeTabId(pathname: string) {
  return TABS.find((tab) => tab.match(pathname))?.id ?? "hub";
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const active = activeTabId(pathname);

  return (
    <>
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="hidden md:flex fixed z-50 left-0 top-1/2 -translate-y-1/2 flex-col items-stretch gap-3"
      >
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              prefetch={false}
              aria-current={isActive ? "page" : undefined}
              className={`px-8 py-4 text-xl font-semibold ring-2 transition rounded-r-xl
                ${
                  isActive
                    ? "bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white ring-white/20 shadow-[0_0_20px_rgba(120,0,255,0.5)]"
                    : "bg-black/50 text-white/80 hover:text-white ring-white/15"
                }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="md:hidden fixed z-50 left-0 right-0 bottom-0 px-3 pb-3"
      >
        <div className="mx-auto max-w-md rounded-2xl ring-1 ring-white/10 bg-black/60 backdrop-blur flex gap-2 p-2">
          {TABS.map((tab) => {
            const isActive = active === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                prefetch={false}
                aria-current={isActive ? "page" : undefined}
                className={`flex-1 h-12 rounded-xl text-xl ring-1 transition flex items-center justify-center
                  ${
                    isActive
                      ? "bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white ring-white/30"
                      : "text-white/70 ring-white/15 hover:text-white"
                  }`}
              >
                {tab.label.split(" ")[0]}
              </Link>
            );
          })}
        </div>
      </motion.div>

      <div className="pt-6 pb-28 md:pb-0 md:pl-28">{children}</div>
    </>
  );
}
