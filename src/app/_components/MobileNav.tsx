"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { FaDiscord, FaTiktok, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const EXIT_DURATION = 0.35;

const NAV = [
  { label: "Coaching", href: "/coaching" },
  { label: "Skillcheck", href: "/skillcheck" },
  { label: "Patreon", href: "https://www.patreon.com/c/Shoaching", external: true },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      setClosing(false);
    } else if (wasOpen.current) {
      setClosing(true);
      wasOpen.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (!closing) return;
    const t = setTimeout(() => setClosing(false), EXIT_DURATION * 1000);
    return () => clearTimeout(t);
  }, [closing]);

  const showContent = open || closing;

  const overlayAnimate = open
    ? { height: "100vh", opacity: 1, y: 0 }
    : closing
      ? { height: "100vh", opacity: 0, y: -4 }
      : { height: 0, opacity: 0, y: 0 };

  return (
    <>
      {/* Toggle button – always visible on mobile */}
      <button
        type="button"
        className="fixed top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-black/40 text-white shadow-md md:hidden"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close navigation" : "Open navigation"}
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sliding overlay from top – shared enter/exit for whole bar */}
      <motion.div
        className="fixed inset-x-0 top-0 z-40 overflow-hidden bg-[#050819]/90 backdrop-blur-md md:hidden"
        initial={{ height: 0, opacity: 0, y: 0 }}
        animate={overlayAnimate}
        transition={{ duration: EXIT_DURATION, ease: [0.22, 1, 0.36, 1] }}
        style={{ pointerEvents: open ? "auto" : "none" }}
      >
        <div className="pt-20 pl-16 pr-5 pb-8 flex h-full flex-col gap-6">
          {/* Main links – slide down with slight stagger */}
          <div className="space-y-2">
            {NAV.map((it, idx) => (
              <motion.div
                key={it.href}
                initial={{ opacity: 0, y: -8 }}
                animate={showContent ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
                transition={{
                  duration: 0.18,
                  ease: [0.22, 1, 0.36, 1],
                  delay: showContent ? 0.04 * idx : 0,
                }}
              >
                {it.external ? (
                  <a
                    href={it.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block py-2 text-lg font-semibold text-white/90 hover:text-orange-400 transition"
                    onClick={() => setOpen(false)}
                  >
                    {it.label}
                  </a>
                ) : (
                  <Link
                    href={it.href}
                    className="block py-2 text-lg font-semibold text-white/90 hover:text-orange-400 transition"
                    onClick={() => setOpen(false)}
                  >
                    {it.label}
                  </Link>
                )}
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={showContent ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
              transition={{
                duration: 0.18,
                ease: [0.22, 1, 0.36, 1],
                delay: showContent ? 0.16 : 0,
              }}
            >
              <Link
                href="/contact"
                className="block py-2 text-lg font-semibold text-white/90 hover:text-orange-400 transition"
                onClick={() => setOpen(false)}
              >
                Contact
              </Link>
            </motion.div>

            {/* Courses – visible but disabled */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={showContent ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
              transition={{
                duration: 0.18,
                ease: [0.22, 1, 0.36, 1],
                delay: showContent ? 0.2 : 0,
              }}
            >
              <div className="py-2 text-base text-white/60 flex items-center gap-3">
                <span className="font-semibold">Courses</span>
                <span className="text-xs px-2 py-0.5 rounded bg-white/10 uppercase tracking-wide">
                  Soon
                </span>
              </div>
            </motion.div>
          </div>

          {/* Socials – continue stagger after nav, slide in L→R; exit with bar */}
          <div className="mt-4 flex items-center gap-4">
            {[
                {
                  key: "discord",
                  href: "https://discord.gg/HfvxZBp",
                  label: "Discord",
                  Icon: FaDiscord,
                },
                {
                  key: "youtube",
                  href: "https://www.youtube.com/@ShoCoaching",
                  label: "YouTube",
                  Icon: FaYoutube,
                },
                {
                  key: "tiktok",
                  href: "https://tiktok.com",
                  label: "TikTok",
                  Icon: FaTiktok,
                },
                {
                  key: "x",
                  href: "https://x.com/Shoaching",
                  label: "X",
                  Icon: FaXTwitter,
                },
              ].map(({ key, href, label, Icon }, idx) => (
                <motion.a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="pl-0 pr-3 py-1.5 rounded-full bg-white/5 text-white/85 hover:bg-white/10 hover:text-orange-400 transition"
                  initial={{ opacity: 0, x: -8 }}
                  animate={
                    showContent
                      ? { opacity: 1, x: 0 }
                      : { opacity: 0, x: -8 }
                  }
                  transition={{
                    duration: 0.18,
                    ease: [0.22, 1, 0.36, 1],
                    // continue same 0.04s staircase after Courses (index 5)
                    // nav: 0,1,2 → delays 0, .04, .08
                    // Contact: index 3 → .12
                    // Courses: index 4 → .16
                    // socials: indices 5–8 → .20, .24, .28, .32
                    delay: showContent ? 0.20 + idx * 0.04 : 0,
                  }}
                >
                  <Icon className="h-5 w-5" />
                </motion.a>
              ))}
          </div>
        </div>
      </motion.div>
    </>
  );
}

