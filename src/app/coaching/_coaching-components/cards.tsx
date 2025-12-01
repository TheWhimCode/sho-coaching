"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Scroll, Lightning, PuzzlePiece, Signature } from "@phosphor-icons/react";
import type { Preset } from "@/engine/session/rules/preset";
import { colorsByPreset } from "@/lib/sessions/colors";
import TransitionOverlay from "@/app/coaching/_coaching-components/components/OverlayTransition";
import { motion, type Variants } from "framer-motion";

type PresetSlug = "vod" | "signature" | "instant";

type Item = {
  slug: PresetSlug;
  title: string;
  subtitle: string;
  duration: string;
  badge?: string;
  image: string;
  price: number;
};

const DEFAULT_ITEMS: Item[] = [
  {
    slug: "vod",
    title: "VOD Review",
    subtitle:
      "The classic. Get a full in-depth breakdown of your gameplay with insights on each stage of the game.",
    duration: "60 min",
    badge: "Most informative",
    image: "/images/sessions/VOD7.png",
    price: 40,
  },
  {
    slug: "signature",
    title: "Signature Session",
    subtitle: "Sho’s recommendation. Focused, structured and designed to make you climb.",
    duration: "45 min + Follow-up",
    badge: "Best overall",
    image: "/images/sessions/Signature3.png",
    price: 45,
  },
  {
    slug: "instant",
    title: "Instant Insight",
    subtitle: "Get quick, actionable answers to your most pressing questions.",
    duration: "30 min",
    badge: "Fastest feedback",
    image: "/images/sessions/Instant4.png",
    price: 20,
  },
];

function SessionIcon({ preset }: { preset: Preset }) {
  const { ring, glow } = colorsByPreset[preset] ?? colorsByPreset.custom;
  const size = 26;
  const glowStyle = { filter: `drop-shadow(0 0 8px ${glow})` } as React.CSSProperties;

  if (preset === "vod") {
    return <Scroll size={size} weight="fill" color={ring} style={glowStyle} aria-hidden />;
  }
  if (preset === "instant") {
    return <Lightning size={size} weight="fill" color={ring} style={glowStyle} aria-hidden />;
  }
  if (preset === "signature") {
    return <Signature size={size} weight="bold" color={ring} style={glowStyle} aria-hidden />;
  }

  return <PuzzlePiece size={size} weight="fill" color={ring} style={glowStyle} aria-hidden />;
}

function GlowRing({ preset, className = "" }: { preset: Preset; className?: string }) {
  const c = colorsByPreset[preset] ?? colorsByPreset.custom;
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        boxShadow: `0 0 0 1px rgba(255,255,255,.08) inset, 0 6px 24px -10px ${c.glow}`,
      }}
    />
  );
}

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.12,
    },
  },
};

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: "easeOut", // ✅ string so TS is happy
    },
  },
};

function Card({ item, onFollowupInfo }: { item: Item; onFollowupInfo?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();

  const [overlayActive, setOverlayActive] = useState(false);
  const [navQueuedTo, setNavQueuedTo] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const c = colorsByPreset[item.slug as Preset] ?? colorsByPreset.custom;
  const cssVars = {
    ["--ring" as const]: c.ring,
    ["--glow" as const]: c.glow,
  } as React.CSSProperties;

  useEffect(() => {
    cancelledRef.current = false;
    setOverlayActive(false);
    setNavQueuedTo(null);
  }, [pathname]);

  useEffect(() => {
    const onPop = () => {
      cancelledRef.current = true;
      setOverlayActive(false);
      setNavQueuedTo(null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigateAfterOverlay = useCallback(() => {
    if (cancelledRef.current) return;
    if (!navQueuedTo) return;
    router.push(navQueuedTo);
  }, [router, navQueuedTo]);

  const handleNavigate = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (overlayActive) return;
    (e.currentTarget as HTMLElement)?.blur?.();
    setNavQueuedTo(`/coaching/${item.slug}`);
    setOverlayActive(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") handleNavigate(e);
  };

  const handleFollowupActivate = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement)?.blur?.();
    onFollowupInfo?.();
  };

  return (
    <>
      <motion.div
        className="relative group"
        role="link"
        tabIndex={0}
        onClick={handleNavigate}
        onKeyDown={handleKeyDown}
        variants={cardVariants}
      >
        <article
          style={cssVars}
          className="relative flex flex-col h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[.03] backdrop-blur-md transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:border-[var(--ring)] hover:shadow-[0_0_10px_1px_var(--glow)] focus-visible:outline-none focus-visible:border-[var(--ring)] focus-visible:shadow-[0_0_10px_1px_var(--glow)]"
        >
          {/* Desktop/Tablet media */}
          <div className="relative w-full aspect-square overflow-hidden rounded-t-3xl max-sm:hidden">
            <Image
              src={item.image}
              alt={item.title}
              fill
              className="object-cover"
              sizes="(max-width: 1200px) 50vw, 33vw"
              priority={false}
            />
          </div>

          {/* Content wrapper */}
          <div className="relative z-10 flex flex-col flex-1 p-7 rounded-b-3xl bg-[#0B0F1A] max-sm:p-0 max-sm:rounded-3xl">
            <GlowRing preset={item.slug as Preset} className="rounded-b-3xl max-sm:rounded-3xl" />

            {/* TOP ROW (mobile) */}
            <div className="max-sm:grid max-sm:grid-cols-[minmax(0,1fr)_auto] max-sm:items-stretch max-sm:gap-0 max-sm:h-[140px] max-sm:overflow-hidden">
              {/* Left text column */}
              <div className="min-w-0 min-h-0 overflow-hidden max-sm:pl-5 max-sm:pr-4 max-sm:pt-5 max-sm:pb-3.5">
                <div className="flex items-start justify-between gap-3 mb-3 max-sm:mb-1.5">
                  <h3 className="text-2xl max-sm:text-[15px] max-sm:leading-5 font-semibold tracking-tight text-white">
                    {item.title}
                  </h3>
                  <div className="max-sm:hidden">
                    <SessionIcon preset={item.slug as Preset} />
                  </div>
                </div>

                {/* Desktop divider */}
                <div className="mb-4 h-px w-full bg-gradient-to-r from-transparent via-white/8 to-transparent max-sm:hidden" />

                {/* Description */}
                <p className="text-white/70 leading-relaxed mb-6 max-sm:text-[14px] max-sm:leading-5 max-sm:line-clamp-4 max-sm:mb-0">
                  {item.subtitle}
                </p>
              </div>

              {/* Right image column (mobile) */}
              <div className="sm:hidden relative h-full aspect-square overflow-hidden max-sm:rounded-tr-3xl self-stretch">
                <Image src={item.image} alt={item.title} fill className="object-cover" priority={false} />
              </div>
            </div>

            {/* Divider (mobile) */}
            <div className="hidden max-sm:block h-px bg-white/10" />

            {/* Footer */}
            <div className="sm:mt-auto max-sm:px-5 max-sm:pt-3.5 max-sm:pb-3.5 flex items-center gap-4 text-base max-sm:text-sm text-white leading-none">
              {item.slug === "signature" ? (
                <span className="font-semibold flex items-center gap-1">
                  45 min +
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="Learn about the Follow-up below"
                    onClick={handleFollowupActivate}
                    className="ml-1 px-2 py-0.5 rounded-full bg-white/10 text-white/90 cursor-pointer transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 inline-flex items-center gap-1"
                  >
                    Follow-up
                    <span
                      className="flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold text-white/70"
                      aria-hidden
                    >
                      ?
                    </span>
                  </span>
                </span>
              ) : (
                <span className="font-semibold">{item.duration}</span>
              )}
              <span className="ml-auto font-semibold">€{item.price}</span>
            </div>
          </div>
        </article>
      </motion.div>

      <TransitionOverlay active={overlayActive} duration={0.7} onComplete={navigateAfterOverlay} />
    </>
  );
}

export default function PresetCards({
  items = DEFAULT_ITEMS,
  className = "",
  containerClassName = "max-w-6xl px-6",
  onFollowupInfo,
}: {
  items?: Item[];
  className?: string;
  containerClassName?: string;
  onFollowupInfo?: () => void;
}) {
  return (
    <section className={`w-full ${className}`}>
      <div className={`mx-auto w-full ${containerClassName}`}>
        <motion.div
          className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {items.map((item) => (
            <Card key={item.slug} item={item} onFollowupInfo={onFollowupInfo} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
