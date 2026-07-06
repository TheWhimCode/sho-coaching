"use client";

import clsx from "clsx";
import Player from "@vimeo/player";
import { useInView } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { guideVimeoEmbed, parseVimeoVideoId } from "@/lib/guides/guideEmbeds";
import { lockScrollViewport } from "@/lib/overlayScrollViewport";

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

const guideVideoShellClass =
  "relative aspect-video w-full overflow-hidden rounded-xl border border-[#F0ABCF]/15 bg-[#1E1724] ring-1 ring-[#B8D8EA]/10";

function GuideVideoSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx("absolute inset-0 animate-pulse bg-[#352839]/90", className)}
      aria-hidden
    />
  );
}

function GuideVideoOverlay({
  overlay,
  onClick,
}: {
  overlay: VideoOverlay;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/35 transition hover:bg-black/45"
      aria-label={overlay === "play" ? "Play video" : "Replay video"}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#F0ABCF]/40 bg-[#2A1F2E]/85 text-[#FAD4E8] ring-1 ring-[#B8D8EA]/20 transition hover:scale-105 sm:h-20 sm:w-20">
        {overlay === "play" ? (
          <PlayIcon className="h-9 w-9 sm:h-11 sm:w-11" />
        ) : (
          <ReplayIcon className="h-8 w-8 sm:h-10 sm:w-10" />
        )}
      </span>
    </button>
  );
}

function GuideVideoProgressBar({
  fillRef,
  trackRef,
  seekable = false,
}: {
  fillRef: React.RefObject<HTMLDivElement | null>;
  trackRef: React.RefObject<HTMLDivElement | null>;
  seekable?: boolean;
}) {
  return (
    <div
      ref={trackRef}
      className={clsx(
        "absolute inset-x-0 bottom-0 z-30 flex h-4 items-end",
        seekable ? "group cursor-pointer touch-none" : "pointer-events-none"
      )}
      role={seekable ? "slider" : undefined}
      aria-label={seekable ? "Video progress" : undefined}
      aria-valuemin={seekable ? 0 : undefined}
      aria-valuemax={seekable ? 100 : undefined}
    >
      <div
        className={clsx(
          "h-[6px] w-full bg-[#F0ABCF]/18 transition-colors",
          seekable && "group-hover:bg-[#F0ABCF]/28"
        )}
      >
        <div ref={fillRef} className="h-full bg-[#F0ABCF] group-hover:bg-[#FAD4E8]" style={{ width: "0%" }} />
      </div>
    </div>
  );
}

function setGuideVideoProgress(fillRef: React.RefObject<HTMLDivElement | null>, ratio: number) {
  const fill = fillRef.current;
  if (!fill) return;
  fill.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
}

function useGuideVideoProgressScrub(
  trackRef: React.RefObject<HTMLDivElement | null>,
  fillRef: React.RefObject<HTMLDivElement | null>,
  seekable: boolean,
  onSeek: (ratio: number) => void
) {
  const scrubbingRef = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !seekable) return;

    const seekToClientX = (clientX: number) => {
      const rect = track.getBoundingClientRect();
      const ratio =
        rect.width <= 0 ? 0 : Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      setGuideVideoProgress(fillRef, ratio);
      onSeek(ratio);
    };

    const endScrub = (event: PointerEvent) => {
      if (!scrubbingRef.current) return;
      scrubbingRef.current = false;
      if (track.hasPointerCapture(event.pointerId)) {
        track.releasePointerCapture(event.pointerId);
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      scrubbingRef.current = true;
      track.setPointerCapture(event.pointerId);
      seekToClientX(event.clientX);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!scrubbingRef.current) return;
      event.preventDefault();
      seekToClientX(event.clientX);
    };

    track.addEventListener("pointerdown", onPointerDown);
    track.addEventListener("pointermove", onPointerMove);
    track.addEventListener("pointerup", endScrub);
    track.addEventListener("pointercancel", endScrub);

    return () => {
      track.removeEventListener("pointerdown", onPointerDown);
      track.removeEventListener("pointermove", onPointerMove);
      track.removeEventListener("pointerup", endScrub);
      track.removeEventListener("pointercancel", endScrub);
    };
  }, [fillRef, onSeek, seekable, trackRef]);

  return scrubbingRef;
}

function ExpandIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={clsx("block shrink-0", className)} aria-hidden>
      <path d="M8 3H3v5M16 3h5v5M16 21h5v-5M8 21H3v-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={clsx("block shrink-0", className)} aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const guideVideoChromeButtonClass =
  "absolute z-40 flex h-9 w-9 items-center justify-center rounded-lg border border-[#F0ABCF]/30 bg-[#2A1F2E]/85 text-[#FAD4E8] ring-1 ring-[#B8D8EA]/15 transition hover:border-[#F0ABCF]/45 hover:bg-[#352839]/90 hover:text-white";

function GuideVideoExpandButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(guideVideoChromeButtonClass, "right-3 top-3 sm:right-4 sm:top-4")}
      aria-label="Expand video"
    >
      <ExpandIcon className="h-4 w-4" />
    </button>
  );
}

function GuideVideoCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(guideVideoChromeButtonClass, "-top-12 right-0 sm:-top-14")}
      aria-label="Close expanded video"
    >
      <CloseIcon className="h-4 w-4" />
    </button>
  );
}

function useGuideVideoExpanded() {
  const [expanded, setExpanded] = useState(false);

  const openExpanded = useCallback(() => setExpanded(true), []);
  const closeExpanded = useCallback(() => setExpanded(false), []);

  return { expanded, openExpanded, closeExpanded, setExpanded };
}

function useGuideVideoExpandedOverlay(onClose: () => void, expanded: boolean) {
  useEffect(() => {
    if (!expanded) return;

    const unlockScroll = lockScrollViewport();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      unlockScroll();
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, expanded]);
}

type PlaybackSnapshot = {
  currentTime: number;
  playing: boolean;
  srcLoaded: boolean;
};

function useGuideVideoPlaybackRestore(
  expanded: boolean,
  videoRef: React.RefObject<HTMLVideoElement | null>,
  overlay: VideoOverlay | null,
  setOverlay: (overlay: VideoOverlay | null) => void,
  armVideo: (video: HTMLVideoElement) => void
) {
  const snapshotRef = useRef<PlaybackSnapshot | null>(null);
  const overlayRef = useRef(overlay);

  useEffect(() => {
    overlayRef.current = overlay;
  }, [overlay]);

  const captureSnapshot = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      snapshotRef.current = null;
      return;
    }

    snapshotRef.current = {
      currentTime: video.currentTime,
      playing: !video.paused && overlayRef.current === null,
      srcLoaded: Boolean(video.src),
    };
  }, [videoRef]);

  useEffect(() => {
    const snapshot = snapshotRef.current;
    if (!snapshot?.srcLoaded) return;

    const video = videoRef.current;
    if (!video) return;

    armVideo(video);

    const restore = () => {
      if (snapshot.currentTime > 0) {
        video.currentTime = snapshot.currentTime;
      }

      if (snapshot.playing) {
        video.muted = false;
        setOverlay(null);
        void video.play().catch(() => setOverlay("play"));
        return;
      }

      if (overlayRef.current === null) {
        setOverlay("play");
      }
    };

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      restore();
      return;
    }

    video.addEventListener("loadedmetadata", restore, { once: true });
    return () => video.removeEventListener("loadedmetadata", restore);
  }, [expanded, armVideo, setOverlay, videoRef]);

  return captureSnapshot;
}

function GuideVideoFrame({
  rootRef,
  showContent,
  showControls,
  progressFillRef,
  progressTrackRef,
  progressSeekable,
  expanded,
  onExpand,
  onClose,
  busy,
  children,
}: {
  rootRef: React.RefObject<HTMLDivElement | null>;
  showContent: boolean;
  showControls: boolean;
  progressFillRef: React.RefObject<HTMLDivElement | null>;
  progressTrackRef: React.RefObject<HTMLDivElement | null>;
  progressSeekable?: boolean;
  expanded: boolean;
  onExpand: () => void;
  onClose: () => void;
  busy?: boolean;
  children: ReactNode;
}) {
  const [portalMounted, setPortalMounted] = useState(false);

  useEffect(() => setPortalMounted(true), []);

  useGuideVideoExpandedOverlay(onClose, expanded);

  const shell = (
    <div
      className={clsx(guideVideoShellClass, expanded && "relative w-full")}
      onClick={(event) => {
        if (expanded) event.stopPropagation();
      }}
    >
      {children}
      {showContent && showControls ? (
        <GuideVideoProgressBar
          fillRef={progressFillRef}
          trackRef={progressTrackRef}
          seekable={progressSeekable}
        />
      ) : null}
      {showContent && showControls && !expanded ? <GuideVideoExpandButton onClick={onExpand} /> : null}
      {showContent && showControls && expanded ? <GuideVideoCloseButton onClick={onClose} /> : null}
    </div>
  );

  return (
    <div ref={rootRef} className="relative w-full">
      {expanded ? <div className="invisible aspect-video w-full" aria-hidden /> : null}

      {!expanded ? (
        <div className="relative w-full" aria-busy={busy}>
          {shell}
        </div>
      ) : null}

      {expanded && portalMounted
        ? createPortal(
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
              aria-busy={busy}
              role="dialog"
              aria-modal="true"
            >
              <button
                type="button"
                className="absolute inset-0 bg-black/70"
                onClick={onClose}
                aria-label="Close expanded video"
              />
              <div className="relative z-10 w-full max-w-5xl">{shell}</div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

function useGuidePoster(posterSrc: string | null | undefined, inView: boolean) {
  const [posterReady, setPosterReady] = useState(!posterSrc);

  useEffect(() => {
    if (!posterSrc || !inView) {
      setPosterReady(!posterSrc);
      return;
    }

    let cancelled = false;
    setPosterReady(false);

    const img = new Image();
    img.onload = () => {
      if (!cancelled) setPosterReady(true);
    };
    img.onerror = () => {
      if (!cancelled) setPosterReady(true);
    };
    img.src = posterSrc;

    return () => {
      cancelled = true;
    };
  }, [posterSrc, inView]);

  return posterReady;
}

function LocalGuideVideo({
  videoSrc,
  posterSrc,
  interactiveControls = false,
}: {
  videoSrc: string;
  posterSrc?: string | null;
  interactiveControls?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const progressTrackRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, margin: "120px 0px" });
  const [overlay, setOverlay] = useState<VideoOverlay | null>("play");
  const posterReady = useGuidePoster(posterSrc, inView);
  const { expanded, openExpanded, closeExpanded, setExpanded } = useGuideVideoExpanded();

  const showContent = inView && posterReady;

  const armVideo = useCallback((video: HTMLVideoElement) => {
    if (!video.src) {
      video.src = videoSrc;
      video.load();
    }
  }, [videoSrc]);

  const handleSeek = useCallback(
    (ratio: number) => {
      const video = videoRef.current;
      if (!video) return;

      armVideo(video);

      const applySeek = () => {
        if (!Number.isFinite(video.duration) || video.duration <= 0) return;
        video.currentTime = ratio * video.duration;
        setGuideVideoProgress(progressFillRef, ratio);
      };

      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
        applySeek();
      } else {
        video.addEventListener("loadedmetadata", applySeek, { once: true });
      }

      if (overlay === "replay") {
        setOverlay("play");
      }
    },
    [armVideo, overlay]
  );

  const scrubbingRef = useGuideVideoProgressScrub(
    progressTrackRef,
    progressFillRef,
    showContent && interactiveControls,
    handleSeek
  );

  useEffect(() => {
    setOverlay("play");
    setGuideVideoProgress(progressFillRef, 0);
    setExpanded(false);
  }, [videoSrc, setExpanded]);

  const captureSnapshot = useGuideVideoPlaybackRestore(
    expanded,
    videoRef,
    overlay,
    setOverlay,
    armVideo
  );

  const handleExpand = useCallback(() => {
    captureSnapshot();
    openExpanded();
  }, [captureSnapshot, openExpanded]);

  const handleClose = useCallback(() => {
    captureSnapshot();
    closeExpanded();
  }, [captureSnapshot, closeExpanded]);

  const handleOverlayClick = () => {
    const video = videoRef.current;
    if (!video || !overlay) return;

    armVideo(video);

    if (overlay === "replay") {
      video.currentTime = 0;
      setGuideVideoProgress(progressFillRef, 0);
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
    setGuideVideoProgress(progressFillRef, 0);
    setOverlay("replay");
  };

  const handleTimeUpdate = () => {
    if (scrubbingRef.current) return;
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    setGuideVideoProgress(progressFillRef, video.currentTime / video.duration);
  };

  return (
    <GuideVideoFrame
      rootRef={rootRef}
      showContent={showContent}
      showControls={interactiveControls}
      progressFillRef={progressFillRef}
      progressTrackRef={progressTrackRef}
      progressSeekable={showContent && interactiveControls}
      expanded={expanded}
      onExpand={handleExpand}
      onClose={handleClose}
      busy={inView && !!posterSrc && !posterReady}
    >
      <div className="grid h-full w-full">
        {!showContent ? (
          <div className="col-start-1 row-start-1">
            <GuideVideoSkeleton />
          </div>
        ) : null}

        <div
          className={clsx(
            "relative col-start-1 row-start-1 h-full w-full",
            !showContent && "opacity-0"
          )}
          aria-hidden={!showContent}
        >
          <video
            key={videoSrc}
            ref={videoRef}
            muted
            playsInline
            preload="none"
            poster={posterSrc ?? undefined}
            onClick={handleVideoClick}
            onEnded={handleEnded}
            onTimeUpdate={handleTimeUpdate}
            className={clsx(
              "h-full w-full object-contain",
              !overlay && "cursor-pointer"
            )}
          />
          {overlay ? <GuideVideoOverlay overlay={overlay} onClick={handleOverlayClick} /> : null}
        </div>
      </div>
    </GuideVideoFrame>
  );
}

function VimeoGuideVideo({
  embedUrl,
  posterSrc,
  title,
  interactiveControls = false,
}: {
  embedUrl: string;
  posterSrc?: string | null;
  title: string;
  interactiveControls?: boolean;
}) {
  const videoId = parseVimeoVideoId(embedUrl);
  const rootRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<Player | null>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const progressTrackRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, margin: "120px 0px" });
  const [overlay, setOverlay] = useState<VideoOverlay | null>("play");
  const [armed, setArmed] = useState(false);
  const [resolvedPoster, setResolvedPoster] = useState<string | null>(posterSrc ?? null);
  const posterReady = useGuidePoster(resolvedPoster, inView);
  const { expanded, openExpanded, closeExpanded, setExpanded } = useGuideVideoExpanded();
  const vimeoSnapshotRef = useRef({ seconds: 0, playing: false });
  const overlayRef = useRef(overlay);

  const showPoster = !armed || overlay === "replay";
  const showContent = inView && posterReady;

  const handleSeek = useCallback((ratio: number) => {
    const player = playerRef.current;
    if (!player) return;

    void player
      .getDuration()
      .then((duration) => {
        if (duration <= 0) return;
        return player.setCurrentTime(ratio * duration);
      })
      .then(() => {
        setGuideVideoProgress(progressFillRef, ratio);
        if (overlayRef.current === "replay") {
          setOverlay("play");
        }
      })
      .catch(() => {});
  }, []);

  const scrubbingRef = useGuideVideoProgressScrub(
    progressTrackRef,
    progressFillRef,
    showContent && interactiveControls && armed,
    handleSeek
  );

  useEffect(() => {
    overlayRef.current = overlay;
  }, [overlay]);

  const captureVimeoSnapshot = useCallback(async () => {
    const player = playerRef.current;
    if (!player) {
      vimeoSnapshotRef.current = { seconds: 0, playing: overlayRef.current === null && armed };
      return;
    }

    try {
      const [seconds, paused] = await Promise.all([player.getCurrentTime(), player.getPaused()]);
      vimeoSnapshotRef.current = { seconds, playing: !paused };
    } catch {
      vimeoSnapshotRef.current = { seconds: 0, playing: overlayRef.current === null && armed };
    }
  }, [armed]);

  const handleExpand = useCallback(() => {
    void captureVimeoSnapshot().then(openExpanded);
  }, [captureVimeoSnapshot, openExpanded]);

  const handleClose = useCallback(() => {
    void captureVimeoSnapshot().then(closeExpanded);
  }, [captureVimeoSnapshot, closeExpanded]);

  useEffect(() => {
    setOverlay("play");
    setGuideVideoProgress(progressFillRef, 0);
    setArmed(false);
    setResolvedPoster(posterSrc ?? null);
    setExpanded(false);
    playerRef.current = null;
  }, [embedUrl, posterSrc, setExpanded]);

  useEffect(() => {
    if (posterSrc || !videoId || !inView) return;

    let cancelled = false;

    void fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${videoId}`)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { thumbnail_url?: string } | null) => {
        if (!cancelled && data?.thumbnail_url) {
          setResolvedPoster(data.thumbnail_url);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [posterSrc, videoId, inView]);

  useEffect(() => {
    if (!armed || !iframeRef.current) return;

    const player = new Player(iframeRef.current);
    playerRef.current = player;
    const snapshot = vimeoSnapshotRef.current;

    const onPlay = () => setOverlay(null);
    const onEnded = () => {
      setGuideVideoProgress(progressFillRef, 0);
      setOverlay("replay");
    };
    const onTimeUpdate = (data: { seconds: number; duration: number }) => {
      if (scrubbingRef.current) return;
      if (data.duration > 0) {
        setGuideVideoProgress(progressFillRef, data.seconds / data.duration);
      }
    };

    player.on("play", onPlay);
    player.on("ended", onEnded);
    player.on("timeupdate", onTimeUpdate);

    const restorePlayback = async () => {
      try {
        if (snapshot.seconds > 0) {
          await player.setCurrentTime(snapshot.seconds);
        }

        if (snapshot.playing) {
          await player.play();
          setOverlay(null);
          return;
        }

        if (snapshot.seconds === 0 && overlayRef.current === "play") {
          await player.play();
          setOverlay(null);
          return;
        }

        await player.pause();
      } catch {
        setOverlay("play");
      }
    };

    void restorePlayback().catch(() => setOverlay("play"));

    return () => {
      player.off("play", onPlay);
      player.off("ended", onEnded);
      player.off("timeupdate", onTimeUpdate);
      void player.destroy();
      playerRef.current = null;
    };
  }, [armed, videoId, expanded]);

  const handleOverlayClick = () => {
    if (!videoId) return;

    if (!armed) {
      setArmed(true);
      return;
    }

    const player = playerRef.current;
    if (!player || !overlay) return;

    if (overlay === "play") {
      void player.play()
        .then(() => setOverlay(null))
        .catch(() => setOverlay("play"));
      return;
    }

    void player.setCurrentTime(0)
      .then(() => {
        setGuideVideoProgress(progressFillRef, 0);
        return player.play();
      })
      .then(() => setOverlay(null))
      .catch(() => setOverlay("replay"));
  };

  const handlePause = () => {
    const player = playerRef.current;
    if (!player || overlay) return;

    void player.pause()
      .then(() => setOverlay("play"))
      .catch(() => {});
  };

  if (!videoId) {
    return (
      <div className={clsx(guideVideoShellClass, "flex items-center justify-center")}>
        <p className="text-sm text-[#F5E6D3]/38 sm:text-base">Invalid Vimeo embed</p>
      </div>
    );
  }

  return (
    <GuideVideoFrame
      rootRef={rootRef}
      showContent={showContent}
      showControls={interactiveControls}
      progressFillRef={progressFillRef}
      progressTrackRef={progressTrackRef}
      progressSeekable={showContent && interactiveControls && armed}
      expanded={expanded}
      onExpand={handleExpand}
      onClose={handleClose}
      busy={inView && !!resolvedPoster && !posterReady}
    >
      <div className="grid h-full w-full">
        {!showContent ? (
          <div className="col-start-1 row-start-1">
            <GuideVideoSkeleton />
          </div>
        ) : null}

        <div
          className={clsx(
            "relative col-start-1 row-start-1 h-full w-full",
            !showContent && "opacity-0"
          )}
          aria-hidden={!showContent}
        >
          {armed ? (
            <iframe
              ref={iframeRef}
              src={guideVimeoEmbed(videoId)}
              title={title}
              className="absolute inset-0 h-full w-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : null}

          {showPoster && resolvedPoster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolvedPoster}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}

          {!overlay && armed ? (
            <button
              type="button"
              aria-label="Pause video"
              className="absolute inset-0 z-10 cursor-pointer"
              onClick={handlePause}
            />
          ) : null}

          {overlay ? <GuideVideoOverlay overlay={overlay} onClick={handleOverlayClick} /> : null}
        </div>
      </div>
    </GuideVideoFrame>
  );
}

export default function GuideVideoPanel({
  videoSrc,
  posterSrc,
  embedUrl,
  title = "Guide video",
  emptyLabel = "Video coming soon",
  interactiveControls = false,
}: {
  videoSrc?: string | null;
  posterSrc?: string | null;
  embedUrl?: string | null;
  title?: string;
  emptyLabel?: string;
  /** Progress scrub + expand overlay — game stages section only. */
  interactiveControls?: boolean;
}) {
  if (videoSrc) {
    return (
      <LocalGuideVideo
        key={videoSrc}
        videoSrc={videoSrc}
        posterSrc={posterSrc}
        interactiveControls={interactiveControls}
      />
    );
  }

  if (embedUrl) {
    return (
      <VimeoGuideVideo
        key={embedUrl}
        embedUrl={embedUrl}
        posterSrc={posterSrc}
        title={title}
        interactiveControls={interactiveControls}
      />
    );
  }

  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-[#F0ABCF]/20 bg-[#1E1724]/55 ring-1 ring-[#B8D8EA]/10">
      <p className="text-sm text-[#F5E6D3]/38 sm:text-base">{emptyLabel}</p>
    </div>
  );
}
