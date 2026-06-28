"use client";

import clsx from "clsx";
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import ComboSequenceBar from "@/app/_components/guides/combos/ComboSequenceBar";
import { renderGuideHighlightedText } from "@/app/_components/guides/guideTextHighlights";
import { guideInnerPanelClass, guideMobileFlushPanelClass, guideSectionHeaderPadClass, guideSectionTitleClass } from "@/lib/guides/guideTheme";
import { prefetchGuideComboVideos } from "@/lib/guides/prefetchGuideVideo";
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
              onFocus={() => prefetchGuideComboVideos(combo)}
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
              onMouseEnter={() => prefetchGuideComboVideos(combo)}
              onFocus={() => prefetchGuideComboVideos(combo)}
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

const FIRST_FRAME_TIME = 0.001;

function useComboVideoPoster(
  videoRef: RefObject<HTMLVideoElement | null>,
  videoSrc: string,
  setPosterReady: (ready: boolean) => void
) {
  useLayoutEffect(() => {
    setPosterReady(false);

    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    let seekFallbackTimer: number | undefined;
    let clearSeekListener: (() => void) | undefined;
    const removeMediaListeners: Array<() => void> = [];

    const cleanup = () => {
      cancelled = true;
      window.clearTimeout(seekFallbackTimer);
      clearSeekListener?.();
      removeMediaListeners.forEach((remove) => remove());
    };

    const markReady = () => {
      if (cancelled) return;
      window.clearTimeout(seekFallbackTimer);
      clearSeekListener?.();
      clearSeekListener = undefined;
      setPosterReady(true);
    };

    const seekToFirstFrame = () => {
      if (cancelled) return;

      clearSeekListener?.();

      const onSeeked = () => {
        markReady();
      };

      video.addEventListener("seeked", onSeeked);
      clearSeekListener = () => video.removeEventListener("seeked", onSeeked);

      seekFallbackTimer = window.setTimeout(markReady, 750);

      try {
        if (
          video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
          Math.abs(video.currentTime - FIRST_FRAME_TIME) < 0.0005
        ) {
          markReady();
          return;
        }
        video.currentTime = FIRST_FRAME_TIME;
      } catch {
        markReady();
      }
    };

    const tryPreparePoster = () => {
      if (cancelled) return;
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        seekToFirstFrame();
        return true;
      }
      return false;
    };

    if (!tryPreparePoster()) {
      const onLoadedData = () => {
        tryPreparePoster();
      };

      video.addEventListener("loadeddata", onLoadedData);
      removeMediaListeners.push(() => video.removeEventListener("loadeddata", onLoadedData));

      const rafId = requestAnimationFrame(() => {
        tryPreparePoster();
      });
      removeMediaListeners.push(() => cancelAnimationFrame(rafId));
    }

    return cleanup;
  }, [videoSrc, setPosterReady, videoRef]);
}

function LocalComboVideo({ videoSrc }: { videoSrc: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [overlay, setOverlay] = useState<VideoOverlay | null>("play");
  const [posterReady, setPosterReady] = useState(false);

  useComboVideoPoster(videoRef, videoSrc, setPosterReady);

  useEffect(() => {
    setOverlay("play");
  }, [videoSrc]);

  const handleOverlayClick = () => {
    const video = videoRef.current;
    if (!video || !overlay) return;

    if (overlay === "replay") {
      video.currentTime = FIRST_FRAME_TIME;
    }

    video.muted = false;
    setOverlay(null);

    void video.play().then(() => {
      setPosterReady(true);
    }).catch(() => {
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
      video.currentTime = FIRST_FRAME_TIME;
    }
    setOverlay("replay");
  };

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[#F0ABCF]/15 bg-[#1E1724] ring-1 ring-[#B8D8EA]/10">
      {!posterReady ? (
        <div className="absolute inset-0 animate-pulse bg-[#2A1F2E]/70" aria-hidden />
      ) : null}
      <video
        ref={videoRef}
        src={videoSrc}
        muted
        playsInline
        preload="auto"
        onClick={handleVideoClick}
        onEnded={handleEnded}
        className={clsx(
          "h-full w-full object-contain transition-opacity duration-200",
          posterReady ? "opacity-100" : "opacity-0",
          !overlay && "cursor-pointer"
        )}
      />
      {overlay ? (
        <button
          type="button"
          onClick={handleOverlayClick}
          className={clsx(
            "absolute inset-0 flex items-center justify-center transition hover:bg-black/45",
            posterReady ? "bg-black/35" : "bg-black/20"
          )}
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

  useEffect(() => {
    if (selected) prefetchGuideComboVideos(selected);
  }, [selected]);

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
          <div className="max-sm:p-0 sm:border-b sm:border-[#F0ABCF]/12 sm:p-5 lg:w-[min(100%,16rem)] lg:shrink-0 lg:border-b-0 lg:border-r xl:w-64">
            <ComboListSidebar
              combos={data.combos}
              selectedId={selected.id}
              onSelect={setSelectedId}
            />
          </div>

          <div className={clsx("min-w-0 flex-1 pb-4 pt-4 sm:p-6 lg:p-8", guideSectionHeaderPadClass)}>
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
