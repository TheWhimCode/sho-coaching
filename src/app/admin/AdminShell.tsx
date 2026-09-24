"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const TABS = [
  { id: "studio", label: "✨ Studio", href: "/admin/studio", match: (p: string) => p === "/admin" || (p.startsWith("/admin/studio") || p.startsWith("/admin/social")) },
  { id: "workout", label: "🏋️ Workout", href: "/admin/workout", match: (p: string) => p.startsWith("/admin/workout") },
  { id: "health", label: "🥗 Health", href: "/admin/health", match: (p: string) => p.startsWith("/admin/health") },
  {
    id: "recipes",
    label: "🍳 Recipes",
    href: "/admin/recipes",
    match: (p: string) => p.startsWith("/admin/recipes"),
  },
] as const;

function activeTabId(pathname: string) {
  return TABS.find((tab) => tab.match(pathname))?.id;
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const active = activeTabId(pathname);
  const [hovering, setHovering] = useState(false);
  useEffect(() => { setHovering(false); }, [pathname]);

  return (
    <>
      <div
        className={`hidden md:block fixed z-50 left-0 top-20 bottom-0 ${hovering ? "w-56" : "w-7"}`}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <div className="absolute left-0 -translate-y-1/2" style={{ top: "calc(50vh - 5rem)" }} aria-hidden={!hovering}>
          <div className={`flex flex-col items-stretch gap-3 transition-opacity duration-300 ${hovering ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            {TABS.map((tab) => {
              const isActive = active === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  prefetch={false}
                  tabIndex={hovering ? undefined : -1}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-2 px-8 py-4 text-xl font-semibold ring-2 transition rounded-r-xl
                    ${
                      isActive
                        ? "bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white ring-white/20 shadow-[0_0_20px_rgba(120,0,255,0.5)]"
                        : "bg-black/50 text-white/80 hover:text-white ring-white/15"
                    }`}
                >
                  <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center text-xl leading-none">{tab.label.split(" ")[0]}</span>
                  <span>{tab.label.split(" ").slice(1).join(" ")}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

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
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
                className={`flex-1 h-12 rounded-xl text-xl ring-1 transition flex items-center justify-center
                  ${
                    isActive
                      ? "bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white ring-white/30"
                      : "text-white/70 ring-white/15 hover:text-white"
                  }`}
              >
                <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center text-xl leading-none">{tab.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </motion.div>

      <div className="pt-6 pb-28 md:pb-0 md:pl-10">{children}</div>
    </>
  );
}
