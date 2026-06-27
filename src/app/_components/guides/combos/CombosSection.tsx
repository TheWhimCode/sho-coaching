"use client";

import clsx from "clsx";
import { useRef, useState } from "react";
import ComboSequenceBar from "@/app/_components/guides/combos/ComboSequenceBar";
import { renderGuideHighlightedText } from "@/app/_components/guides/guideTextHighlights";
import { guideInnerPanelClass, guideSectionTitleClass } from "@/lib/guides/guideTheme";
import type { GuideComboPageData, GuideViegoAbilityIcons } from "@/lib/guides/comboGuideTypes";

const comboListButtonClass =
  "w-full rounded-xl border px-3 py-2.5 text-left text-xs font-semibold tracking-wide transition sm:px-4 sm:py-3 sm:text-sm";

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={clsx("block shrink-0", className)} aria-hidden>
      <path d="M9 6v12l9-6-9-6z" />
    </svg>
  );
}

function ReplayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={clsx("block shrink-0", className)} aria-hidden>
      <path d="M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 4v5h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type VideoOverlay = "play" | "replay";

function LocalComboVideo({ videoSrc }: { videoSrc: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [overlay, setOverlay] = useState<VideoOverlay | null>("play");

  const handleOverlayClick = () => {
    const video = videoRef.current;
    if (!video || !overlay) return;

    if (overlay === "replay") {
      video.currentTime = 0;
    }

    video.muted = false;
    setOverlay(null);

    void video.play().catch(() => {
      setOverlay(overlay);
    });
  };

  const handleVideoClick = () => {
    const video = videoRef.current;
    if (!video || overlay) return;

    video.pause();
    setOverlay("play");
  };

  const handleEnded = () => {
    videoRef.current?.pause();
    setOverlay("replay");
  };

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[#F0ABCF]/15 bg-black ring-1 ring-[#B8D8EA]/10">
      <video
        ref={videoRef}
        src={videoSrc}
        playsInline
        preload="metadata"
        onClick={handleVideoClick}
        onEnded={handleEnded}
        className={clsx("h-full w-full object-contain", !overlay && "cursor-pointer")}
      />
      {overlay ? (
        <button
          type="button"
          onClick={handleOverlayClick}
          className="absolute inset-0 flex items-center justify-center bg-black/35 transition hover:bg-black/45"
          aria-label={overlay === "play" ? "Play combo video" : "Replay combo video"}
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#F0ABCF]/40 bg-[#2A1F2E]/85 text-[#FAD4E8] ring-1 ring-[#B8D8EA]/20 transition hover:scale-105 sm:h-20 sm:w-20">
            {overlay === "play" ? (
              <PlayIcon className="h-9 w-9 sm:h-11 sm:w-11" />
            ) : (
              <ReplayIcon className="h-8 w-8 sm:h-10 sm:w-10" />
            )}
          </span>
        </button>
      ) : null}
    </div>
  );
}

function ComboVideoPanel({
  videoSrc,
  embedUrl,
}: {
  videoSrc?: string | null;
  embedUrl?: string | null;
}) {
  if (videoSrc) {
    return <LocalComboVideo key={videoSrc} videoSrc={videoSrc} />;
  }

  if (embedUrl) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl border border-[#F0ABCF]/15 bg-black ring-1 ring-[#B8D8EA]/10">
        <iframe
          src={embedUrl}
          title="Combo video"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-[#F0ABCF]/20 bg-[#1E1724]/55 ring-1 ring-[#B8D8EA]/10">
      <p className="text-sm text-[#F5E6D3]/38 sm:text-base">Video coming soon</p>
    </div>
  );
}

export default function CombosSection({
  data,
  abilityIcons,
  guideTextIcons = {},
}: {
  data: GuideComboPageData;
  abilityIcons: GuideViegoAbilityIcons;
  guideTextIcons?: Record<string, string>;
}) {
  const [selectedId, setSelectedId] = useState(data.combos[0]?.id ?? "");
  const selected =
    data.combos.find((combo) => combo.id === selectedId) ?? data.combos[0];

  if (!selected) return null;

  return (
    <section id="combos" className="scroll-mt-24">
      <div className="mb-6">
        <h2 className={guideSectionTitleClass}>{data.heading}</h2>
        {data.subtitle ? (
          <p className="mt-2 text-sm text-[#F5E6D3]/55 sm:text-base">{data.subtitle}</p>
        ) : null}
      </div>

      <div className={clsx(guideInnerPanelClass, "overflow-hidden p-0 sm:p-0")}>
        <div className="flex flex-col lg:flex-row">
          <div className="border-b border-[#F0ABCF]/12 p-4 sm:p-5 lg:w-[min(100%,16rem)] lg:shrink-0 lg:border-b-0 lg:border-r xl:w-64">
            <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#B8D8EA]/80 sm:text-xs">
              Select combo
            </p>
            <div className="flex flex-col gap-2">
              {data.combos.map((combo) => {
                const active = combo.id === selected.id;
                return (
                  <button
                    key={combo.id}
                    type="button"
                    onClick={() => setSelectedId(combo.id)}
                    className={clsx(
                      comboListButtonClass,
                      active
                        ? "border-[#F0ABCF]/40 bg-[#F0ABCF]/10 text-[#FAD4E8] ring-1 ring-[#F0ABCF]/25"
                        : "border-[#F0ABCF]/12 bg-[#16121A]/40 text-[#F5E6D3]/55 hover:border-[#F0ABCF]/22 hover:bg-[#F0ABCF]/5 hover:text-[#F5E6D3]/78"
                    )}
                    aria-pressed={active}
                  >
                    {combo.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
            {selected.sequence?.length ? (
              <ComboSequenceBar sequence={selected.sequence} abilityIcons={abilityIcons} />
            ) : null}
            <h3 className="text-base font-semibold text-[#FAD4E8]/90 sm:text-lg">
              {selected.label}
            </h3>
            <div className="mt-4">
              <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#B8D8EA]/80 sm:text-xs">
                Combo clip
              </p>
              <ComboVideoPanel
                key={`${selected.id}-clip`}
                videoSrc={selected.videoSrc}
                embedUrl={selected.videoEmbedUrl}
              />
            </div>
            <div className="mt-5 text-sm leading-[1.75] text-[#F5E6D3]/62 sm:text-base">
              <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#B8D8EA]/80 sm:text-xs">
                When to use it
              </p>
              {selected.explanation.split("\n").map((paragraph, index) => (
                <p key={index} className={index > 0 ? "mt-[0.5em]" : undefined}>
                  {renderGuideHighlightedText(paragraph, guideTextIcons)}
                </p>
              ))}
            </div>
            <div className="mt-5">
              <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#B8D8EA]/80 sm:text-xs">
                Ingame example
              </p>
              <ComboVideoPanel
                key={`${selected.id}-ingame`}
                videoSrc={selected.ingameExampleVideoSrc}
                embedUrl={selected.ingameExampleVideoEmbedUrl}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
