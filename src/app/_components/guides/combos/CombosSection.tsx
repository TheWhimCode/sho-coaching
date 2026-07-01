"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import ComboSequenceBar from "@/app/_components/guides/combos/ComboSequenceBar";
import { renderGuideHighlightedText } from "@/app/_components/guides/guideTextHighlights";
import { guideInnerPanelClass, guideMobileFlushPanelClass, guideSectionHeaderPadClass, guideSectionTitleClass } from "@/lib/guides/guideTheme";
import type { GuideComboPageData, GuideViegoAbilityIcons } from "@/lib/guides/comboGuideTypes";

const comboListButtonClass =
  "w-full rounded-xl border px-3 py-2.5 text-left text-xs font-semibold tracking-wide transition sm:px-4 sm:py-3 sm:text-sm";

const comboMobileGridButtonClass =
  "flex w-full min-h-[3.5rem] items-center justify-center border border-[#F0ABCF]/12 px-2 py-3 text-center text-xs font-semibold tracking-wide transition";

function comboGridCellClass({
  index,
  active,
}: {
  index: number;
  active: boolean;
}) {
  const colIdx = index % 2;
  const isLeftCol = colIdx === 0;
  const isRightCol = colIdx === 1;

  return clsx(
    comboMobileGridButtonClass,
    isLeftCol && "border-l-0",
    isRightCol && "border-r-0",
    active
      ? "relative z-[1] bg-[#F0ABCF]/10 text-[#FAD4E8] ring-1 ring-inset ring-[#F0ABCF]/25"
      : "bg-[#16121A]/40 text-[#F5E6D3]/55"
  );
}

function ComboListSidebar({
  combos,
  selectedId,
  onSelect,
}: {
  combos: GuideComboPageData["combos"];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const paddedCount = combos.length + (combos.length % 2);

  return (
    <>
      <p className="mb-3 hidden text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#B8D8EA]/80 sm:block sm:text-xs">
        Select combo
      </p>

      <div className="relative left-1/2 w-screen max-w-none -translate-x-1/2 sm:static sm:w-full sm:max-w-full sm:translate-x-0">
        <div className="grid grid-cols-2 isolate sm:hidden">
        {Array.from({ length: paddedCount }, (_, index) => {
          const combo = combos[index];
          if (!combo) {
            const colIdx = index % 2;
            const isLeftCol = colIdx === 0;
            const isRightCol = colIdx === 1;

            return (
              <div
                key={`combo-grid-pad-${index}`}
                aria-hidden
                className={clsx(
                  "min-h-[3.5rem] border border-[#F0ABCF]/12 bg-[#16121A]/20",
                  isLeftCol && "border-l-0",
                  isRightCol && "border-r-0"
                )}
              />
            );
          }

          const active = combo.id === selectedId;
          return (
            <button
              key={combo.id}
              type="button"
              onClick={() => onSelect(combo.id)}
              className={comboGridCellClass({
                index,
                active,
              })}
              aria-pressed={active}
            >
              {combo.label}
            </button>
          );
        })}
        </div>
      </div>

      <div className="hidden flex-col gap-2 sm:flex">
        {combos.map((combo) => {
          const active = combo.id === selectedId;
          return (
            <button
              key={combo.id}
              type="button"
              onClick={() => onSelect(combo.id)}
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
    </>
  );
}

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
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inView = useInView(rootRef, { once: true, margin: "120px 0px" });
  const [overlay, setOverlay] = useState<VideoOverlay | null>("play");

  useEffect(() => {
    setOverlay("play");
  }, [videoSrc]);

  const armVideo = (video: HTMLVideoElement) => {
    if (!video.src) {
      video.src = videoSrc;
      video.load();
    }
  };

  const handleOverlayClick = () => {
    const video = videoRef.current;
    if (!video || !overlay) return;

    armVideo(video);

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
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    setOverlay("replay");
  };

  return (
    <div
      ref={rootRef}
      className="relative aspect-video w-full overflow-hidden rounded-xl border border-[#F0ABCF]/15 bg-[#1E1724] ring-1 ring-[#B8D8EA]/10"
    >
      {!inView ? (
        <div className="absolute inset-0 animate-pulse bg-[#2A1F2E]/70" aria-hidden />
      ) : (
        <>
          <video
            key={videoSrc}
            ref={videoRef}
            muted
            playsInline
            preload="none"
            onClick={handleVideoClick}
            onEnded={handleEnded}
            className={clsx(
              "h-full w-full object-contain",
              !overlay && "cursor-pointer"
            )}
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
        </>
      )}
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
    <section id="combos" className="scroll-mt-24 w-full min-w-0 max-w-full overflow-x-hidden sm:overflow-visible">
      <div className={clsx("mb-6", guideSectionHeaderPadClass)}>
        <h2 className={guideSectionTitleClass}>{data.heading}</h2>
        {data.subtitle ? (
          <p className="mt-2 text-sm text-[#F5E6D3]/55 sm:text-base">{data.subtitle}</p>
        ) : null}
      </div>

      <div
        className={clsx(
          guideInnerPanelClass,
          guideMobileFlushPanelClass,
          "overflow-hidden max-sm:!border-0 max-sm:!bg-transparent max-sm:!p-0 sm:p-0"
        )}
      >
        <div className="flex flex-col lg:flex-row">
          <div className="max-sm:p-0 sm:border-b sm:border-[#F0ABCF]/12 sm:py-5 sm:pl-4 sm:pr-6 lg:w-[min(100%,16rem)] lg:shrink-0 lg:border-b-0 lg:border-r lg:pl-4 lg:pr-8 xl:w-64">
            <ComboListSidebar
              combos={data.combos}
              selectedId={selected.id}
              onSelect={setSelectedId}
            />
          </div>

          <div className="min-w-0 flex-1 px-6 pb-4 pt-4 sm:p-6 lg:py-4 lg:pl-8 lg:pr-4">
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
