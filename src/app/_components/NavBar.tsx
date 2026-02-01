// src/app/_components/NavBar.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { FaDiscord, FaTiktok, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { useNavChrome } from "@/app/_components/navChrome";
import { usePathname } from "next/navigation";

const NAV = [
  { label: "Coaching", href: "/coaching" },
  { label: "Skillcheck", href: "/skillcheck" },
  { label: "Patreon", href: "https://www.patreon.com/c/Shoaching", external: true },
];

const COURSE_LINKS = [
  { label: "Top", href: "/courses/top" },
  { label: "Jungle", href: "/courses/jungle" },
  { label: "Mid", href: "/courses/mid" },
  { label: "Top", href: "/courses/top" },
  { label: "Support", href: "/courses/support" },
];

export default function NavBar({
  className = "",
  logoOnly = false,
}: {
  className?: string;
  logoOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [opacity, setOpacity] = useState(1);

  // hover state for logo-only reveal
  const [hovered, setHovered] = useState(false);

  // prevents flash on route enter while still allowing fade-out after
  const [logoOnlyReady, setLogoOnlyReady] = useState(true);
  const [hoverArmed, setHoverArmed] = useState(true);

  const { chrome, setChrome } = useNavChrome();
  const pathname = usePathname() || "";

  // override wins during transition
  const effectiveLogoOnly = chrome === "logoOnly" ? true : logoOnly;

  // once the route changes, clear the override
  useEffect(() => {
    if (chrome !== "auto") setChrome("auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const maxScroll = 100;

    const root = document.getElementById("scroll-root");
    const viewport = root?.querySelector<HTMLElement>(
      "[data-overlayscrollbars-viewport]"
    );

    const scroller = viewport ?? window;

    const onScroll = () => {
      const y =
        scroller === window
          ? window.scrollY
          : (scroller as HTMLElement).scrollTop;

      setOpacity(Math.max(0, Math.min(1, 1 - y / maxScroll)));
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // initial sync

    return () => {
      scroller.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Entering logo-only: hide immediately with transitions disabled for 1 frame,
  // then enable transitions so hover-out can fade.
  useEffect(() => {
    if (!effectiveLogoOnly) {
      setLogoOnlyReady(true);
      setHoverArmed(true);
      return;
    }

    setOpen(false);
    setHovered(false);

    setLogoOnlyReady(false);
    setHoverArmed(false);

    const id = requestAnimationFrame(() => {
      setLogoOnlyReady(true);
      setHoverArmed(true);
    });

    return () => cancelAnimationFrame(id);
  }, [effectiveLogoOnly]);

  // In logo-only mode:
  // - hidden by default
  // - fades in/out on hover after ready
  // Otherwise: normal scroll fade
  const barOpacity = effectiveLogoOnly ? (hovered ? 1 : 0) : opacity;

  // Pointer events logic
  const barPointerEvents = effectiveLogoOnly
    ? hovered
      ? "auto"
      : "none"
    : opacity < 0.1
      ? "none"
      : "auto";

  const toggleMenu = () => {
    if (effectiveLogoOnly) return;
    setOpen((v) => !v);
  };

  const barClassName = effectiveLogoOnly
    ? logoOnlyReady
      ? "transition-[opacity] duration-500"
      : ""
    : "transition-[opacity] duration-75";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 ${className}`}
      onMouseEnter={() => effectiveLogoOnly && hoverArmed && setHovered(true)}
      onMouseLeave={() => effectiveLogoOnly && setHovered(false)}
      onMouseMove={() => effectiveLogoOnly && !hoverArmed && setHoverArmed(true)}
    >
      {/* LOGO */}
      <Link
        href="/"
        className="absolute left-4 md:left-6 top-8 md:top-10 -translate-y-1/2 z-20 flex items-center"
      >
        <Image
          src="/images/Logo_blue.png"
          alt="Sho Coaching Logo"
          width={38}
          height={38}
          priority
          sizes="38px"
          className="rounded-md"
        />
      </Link>

      {/* Fading bar */}
      <div
        className={barClassName}
        style={{ opacity: barOpacity, pointerEvents: barPointerEvents }}
      >
        <div
          className={[
            "absolute inset-0 -z-10 bg-[#0B0F1A]/30 border-b border-white/10",
            effectiveLogoOnly ? "" : "backdrop-blur-md",
          ].join(" ")}
        />

        <nav className="w-full">
          <div className="relative h-16 md:h-20 flex items-center pl-14 md:pl-20 pr-4 md:pr-8">
            {/* LEFT */}
            <span className="text-lg md:text-xl font-semibold tracking-tight">
              Sho Coaching
            </span>

            {/* CENTER */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="hidden md:flex items-center gap-8 pointer-events-auto">
                {NAV.map((it) =>
                  it.external ? (
                    <a
                      key={it.href}
                      href={it.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base md:text-lg text-white/80 hover:text-orange-400 transition"
                    >
                      {it.label}
                    </a>
                  ) : (
                    <Link
                      key={it.href}
                      href={it.href}
                      className="text-base md:text-lg text-white/80 hover:text-orange-400 transition"
                    >
                      {it.label}
                    </Link>
                  )
                )}

                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  title="Courses coming soon"
                  className="text-base md:text-lg text-white/50 cursor-not-allowed select-none"
                >
                  Courses
                </button>

                <Link
                  href="/contact"
                  className="text-base md:text-lg text-white/80 hover:text-orange-400 transition"
                >
                  Contact
                </Link>
              </div>
            </div>

            {/* RIGHT */}
            <div className="ml-auto flex items-center">
              <div className="hidden md:flex items-center gap-3">
                <Link
                  href="https://discord.gg/HfvxZBp"
                  target="_blank"
                  aria-label="Discord"
                  className="p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-orange-400"
                >
                  <FaDiscord className="h-5 w-5" />
                </Link>
                <Link
                  href="https://www.youtube.com/@ShoCoaching"
                  target="_blank"
                  aria-label="YouTube"
                  className="p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-orange-400"
                >
                  <FaYoutube className="h-5 w-5" />
                </Link>
                <Link
                  href="https://tiktok.com"
                  target="_blank"
                  aria-label="TikTok"
                  className="p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-orange-400"
                >
                  <FaTiktok className="h-5 w-5" />
                </Link>
                <Link
                  href="https://x.com/Shoaching"
                  target="_blank"
                  aria-label="X"
                  className="p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-orange-400"
                >
                  <FaXTwitter className="h-5 w-5" />
                </Link>
              </div>

              {/* Mobile hamburger */}
              <button
                className="md:hidden ml-2 p-2 rounded-lg hover:bg-white/10"
                onClick={toggleMenu}
                aria-label="Toggle menu"
              >
                {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile dropdown */}
        {open && !effectiveLogoOnly && (
          <div className="md:hidden border-t border-white/10 bg-[#0B0F1A]/90 backdrop-blur-md">
            <div className="px-4 py-3">
              <div className="flex flex-col">
                {NAV.map((it) =>
                  it.external ? (
                    <a
                      key={it.href}
                      href={it.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 text-base text-white/80 hover:text-orange-400"
                      onClick={() => setOpen(false)}
                    >
                      {it.label}
                    </a>
                  ) : (
                    <Link
                      key={it.href}
                      href={it.href}
                      className="py-2 text-base text-white/80 hover:text-orange-400"
                      onClick={() => setOpen(false)}
                    >
                      {it.label}
                    </Link>
                  )
                )}

                <div className="py-2 text-base text-white/50 flex items-center justify-between">
                  <span>Courses</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-white/10">
                    Soon
                  </span>
                </div>

                <Link
                  href="/contact"
                  className="py-2 text-base text-white/80 hover:text-orange-400"
                  onClick={() => setOpen(false)}
                >
                  Contact
                </Link>

                <div className="mt-3 flex items-center gap-3">
                  <Link
                    href="https://www.youtube.com/@ShoCoaching"
                    target="_blank"
                    className="p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-orange-400"
                  >
                    <FaYoutube className="h-5 w-5" />
                  </Link>
                  <Link
                    href="https://tiktok.com"
                    target="_blank"
                    className="p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-orange-400"
                  >
                    <FaTiktok className="h-5 w-5" />
                  </Link>
                  <Link
                    href="https://discord.gg/HfvxZBp"
                    target="_blank"
                    className="p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-orange-400"
                  >
                    <FaDiscord className="h-5 w-5" />
                  </Link>
                  <Link
                    href="https://x.com/Shoaching"
                    target="_blank"
                    className="p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-orange-400"
                  >
                    <FaXTwitter className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
