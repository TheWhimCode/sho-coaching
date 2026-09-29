"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const TABS = [
  { id: "today", label: "Today", icon: "📅", href: "/admin/today", match: (p: string) => p === "/admin" || p.startsWith("/admin/today") },
  { id: "studio", label: "Studio", icon: "📋", href: "/admin/studio", match: (p: string) => p.startsWith("/admin/studio") || p.startsWith("/admin/social") },
  { id: "workout", label: "Workout", icon: "", href: "/admin/workout", match: (p: string) => p.startsWith("/admin/workout") },
  { id: "recipes", label: "Recipes", icon: "🍳", href: "/admin/recipes", match: (p: string) => p.startsWith("/admin/recipes") },
  { id: "health", label: "Health", icon: "🥗", href: "/admin/health", match: (p: string) => p.startsWith("/admin/health") },
] as const;

function TabGlyph({ id, icon }: { id: string; icon: string }) {
  if (id !== "workout") return icon;
  return <svg viewBox="0 0 24 24" width="1.15em" height="1.15em" aria-hidden="true">
    <rect x="1" y="6.5" width="3.4" height="11" rx="1.1" fill="#8D93A0" />
    <rect x="4.6" y="8.2" width="2.5" height="7.6" rx="0.7" fill="#E4E7EE" />
    <rect x="6.8" y="10.5" width="10.4" height="3" rx="1.2" fill="#C5CAD3" />
    <rect x="16.9" y="8.2" width="2.5" height="7.6" rx="0.7" fill="#E4E7EE" />
    <rect x="19.6" y="6.5" width="3.4" height="11" rx="1.1" fill="#8D93A0" />
  </svg>;
}

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
        className={`hidden md:block fixed z-50 left-0 top-20 bottom-0 ${hovering ? "w-16" : "w-3"}`}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <div className="absolute left-2 -translate-y-1/2" style={{ top: "calc(50vh - 5rem)" }} aria-hidden={!hovering}>
          <div className={`flex flex-col items-start gap-2 transition-opacity duration-300 ${hovering ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            {TABS.map((tab) => {
              const isActive = active === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  prefetch={false}
                  tabIndex={hovering ? undefined : -1}
                  aria-label={tab.label}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex h-11 w-11 items-center justify-center rounded-lg text-lg leading-none ring-1 transition
                    ${
                      isActive
                        ? "bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white ring-white/20 shadow-[0_0_12px_rgba(120,0,255,0.45)]"
                        : "bg-black/50 text-white/80 hover:text-white ring-white/15"
                    }`}
                >
                  <span aria-hidden="true" className="flex items-center justify-center leading-none"><TabGlyph id={tab.id} icon={tab.icon} /></span>
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
                <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center text-xl leading-none"><TabGlyph id={tab.id} icon={tab.icon} /></span>
              </Link>
            );
          })}
        </div>
      </motion.div>

      <div className="pt-6 pb-28 md:pb-0 md:pl-10">{children}</div>
    </>
  );
}
