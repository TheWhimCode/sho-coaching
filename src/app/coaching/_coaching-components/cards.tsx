"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Scroll, Lightning, PuzzlePiece, Signature, StackPlus } from "@phosphor-icons/react";
import type { Preset } from "@/engine/session/rules/preset";
import { colorsByPreset, computePriceEUR, computePriceWithProduct, formatPriceEUR } from "@/engine/session";
import {
  RUSH_BUNDLE_COMPARE_AT_EUR,
} from "@/engine/session/model/product";
import PromoPrice from "@/components/PromoPrice";
import TransitionOverlay from "@/app/coaching/_coaching-components/components/OverlayTransition";
import { motion, type Variants } from "framer-motion";
import { useNavChrome } from "@/app/_components/navChrome";
import { COACHING_CARD_IMAGES } from "@/app/coaching/coachingPageAssets";

type PresetSlug = "vod" | "signature" | "rush";

type Item = {
  slug: PresetSlug;
  title: string;
  subtitle: string;
  duration: string;
  badge?: string;
  featured?: boolean;
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
    badge: "Most analytical",
    image: "/images/sessions/VOD7.webp",
    price: computePriceEUR(60, 0).priceEUR,
  },
  {
    slug: "signature",
    title: "Signature Session",
    subtitle: "Sho’s recommendation. Focused, structured and designed to make you climb.",
    duration: "45 min + Follow-up",
    badge: "Most popular",
    featured: true,
    image: COACHING_CARD_IMAGES[1],
    price: computePriceEUR(45, 1).priceEUR,
  },
  {
    slug: "rush",
    title: "Elo Rush",
    subtitle: "4 sessions with built-in momentum. Best value if you're serious about climbing.",
    duration: "60 min ×4",
    badge: "Best value",
    image: COACHING_CARD_IMAGES[2],
    price: computePriceWithProduct({
      liveMin: 60,
      followups: 0,
      liveBlocks: 0,
      productId: "rush",
    }).priceEUR,
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
  if (preset === "rush") {
    return <StackPlus size={size} weight="fill" color={ring} style={glowStyle} aria-hidden />;
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

function CardBadge({
  badge,
  preset,
  compact = false,
}: {
  badge: string;
  preset: Preset;
  compact?: boolean;
}) {
  const c = colorsByPreset[preset] ?? colorsByPreset.custom;
  return (
    <span
      className={
        compact
          ? "pointer-events-none inline-flex max-w-[5.5rem] items-center justify-center rounded-full border px-1 py-0.5 text-center text-[7px] font-bold uppercase leading-tight tracking-wide backdrop-blur-md"
          : "pointer-events-none inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md sm:text-[11px] sm:px-3"
      }
      style={{
        color: c.ring,
        borderColor: `color-mix(in srgb, ${c.ring} 55%, transparent)`,
        background: `color-mix(in srgb, ${c.ring} 16%, rgba(11, 15, 26, 0.82))`,
        boxShadow: `0 0 14px -2px ${c.glow}`,
      }}
    >
      {badge}
    </span>
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
  const { setChrome } = useNavChrome();

  const [overlayActive, setOverlayActive] = useState(false);
  const [navQueuedTo, setNavQueuedTo] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const c = colorsByPreset[item.slug as Preset] ?? colorsByPreset.custom;
  const cssVars = {
    ["--ring" as const]: c.ring,
    ["--glow" as const]: c.glow,
  } as React.CSSProperties;

  const priceQuote =
    item.slug === "signature"
      ? computePriceEUR(45, 1)
      : item.slug === "vod"
        ? computePriceEUR(60, 0)
        : computePriceEUR(30, 0);

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

    setChrome("logoOnly"); // hide navbar immediately during transition
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
        className="relative group cursor-pointer outline-none transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none"
        role="link"
        tabIndex={0}
        onClick={handleNavigate}
        onKeyDown={handleKeyDown}
        variants={cardVariants}
      >
        {item.badge ? (
          <div className="pointer-events-none absolute top-4 left-4 z-20 max-sm:hidden">
            <CardBadge badge={item.badge} preset={item.slug as Preset} />
          </div>
        ) : null}

        <article
          style={cssVars}
          className={[
            "relative flex flex-col h-full overflow-hidden rounded-3xl border bg-white/[.03] backdrop-blur-md transition-[border-color,box-shadow] duration-300",
            item.featured
              ? "border-[color-mix(in_srgb,var(--ring)_48%,rgba(255,255,255,0.14))] shadow-[0_0_32px_-14px_var(--glow)]"
              : "border-white/10",
            "group-hover:border-[var(--ring)] group-hover:shadow-[0_0_10px_1px_var(--glow)] group-focus-visible:border-[var(--ring)] group-focus-visible:shadow-[0_0_10px_1px_var(--glow)]",
          ].join(" ")}
        >
          {/* Desktop/Tablet media */}
          <div className="relative w-full aspect-square overflow-hidden rounded-t-3xl max-sm:hidden">
            <Image
              src={item.image}
              alt={item.title}
              fill
              className="object-cover"
              sizes="(max-width: 1200px) 50vw, 33vw"
              priority
              fetchPriority="high"
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
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                  priority
                  fetchPriority="high"
                />
                {item.badge ? (
                  <div className="pointer-events-none absolute top-2 left-2 z-10">
                    <CardBadge badge={item.badge} preset={item.slug as Preset} compact />
                  </div>
                ) : null}
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

              {item.slug === "rush" ? (
                <span className="ml-auto font-semibold flex items-baseline gap-2">
                  <span
                    className="
                      inline-flex items-center
                      bg-gradient-to-br from-[#1E9FFF] to-[#FF8C00]
                      bg-clip-text text-transparent font-extrabold
                      drop-shadow-[0_0_6px_rgba(30,159,255,0.6),0_0_12px_rgba(255,140,0,0.5)]
                    "
                  >
                    €{formatPriceEUR(item.price)}
                  </span>
                  <span className="text-[14px] font-semibold line-through leading-none opacity-60">
                    €{formatPriceEUR(RUSH_BUNDLE_COMPARE_AT_EUR)}
                  </span>
                </span>
              ) : (
                <PromoPrice
                  className="ml-auto font-semibold"
                  priceEUR={priceQuote.priceEUR}
                  listPriceEUR={priceQuote.listPriceEUR}
                  discountPercent={priceQuote.discountPercent}
                />
              )}
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