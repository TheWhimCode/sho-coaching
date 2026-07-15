"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { FaTwitch } from "react-icons/fa6";
import GuideImage from "@/app/_components/guides/GuideImage";
import { MINO_PROFILE_IMAGE } from "@/lib/coaching/coachingClipVideos";
import {
  TWITCH_CHANNEL_DISPLAY,
  TWITCH_CHANNEL_LOGIN,
  TWITCH_CHANNEL_URL,
} from "@/lib/twitch/channel";
import type { TwitchStreamStatus } from "@/lib/twitch/types";
import { getTwitchEmbedParentHosts } from "@/lib/twitch/parentHosts";
import { guideSectionHeaderPadClass } from "@/lib/guides/guideTheme";

function buildTwitchEmbedUrl(channel: string, parentHosts: string[]) {
  const params = new URLSearchParams();
  params.set("channel", channel);
  for (const host of parentHosts) {
    params.append("parent", host);
  }
  params.set("muted", "true");
  return `https://player.twitch.tv/?${params.toString()}`;
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FF4D6D]/55 bg-[#FF4D6D]/18 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#FFB3C1] sm:text-xs">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF4D6D] opacity-70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF4D6D]" />
      </span>
      Live now
    </span>
  );
}

function TwitchShoutoutSkeleton() {
  return (
    <div
      aria-hidden
      className="overflow-hidden rounded-2xl border border-[#9146FF]/20 bg-[#1E1724]/80 ring-1 ring-[#9146FF]/15"
    >
      <div className="p-5 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-4 sm:hidden">
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-4">
            <div className="h-16 w-16 shrink-0 animate-pulse rounded-2xl bg-[#352839]/90 sm:h-20 sm:w-20" />
            <div className="space-y-2">
              <div className="h-3 w-12 animate-pulse rounded bg-[#352839]/70" />
              <div className="h-6 w-40 animate-pulse rounded bg-[#352839]/70" />
            </div>
            <div className="col-span-2 space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-[#352839]/55" />
              <div className="h-4 w-[92%] animate-pulse rounded bg-[#352839]/55" />
            </div>
          </div>
          <div className="mx-auto h-11 w-44 animate-pulse rounded-full bg-[#352839]/70" />
        </div>

        <div className="hidden items-center justify-between gap-5 sm:flex">
          <div className="flex min-w-0 items-center gap-4">
            <div className="h-20 w-20 shrink-0 animate-pulse rounded-2xl bg-[#352839]/90" />
            <div className="min-w-0 space-y-2">
              <div className="h-3 w-12 animate-pulse rounded bg-[#352839]/70" />
              <div className="h-7 w-48 animate-pulse rounded bg-[#352839]/70" />
              <div className="h-4 w-80 max-w-full animate-pulse rounded bg-[#352839]/55" />
              <div className="h-4 w-72 max-w-full animate-pulse rounded bg-[#352839]/55" />
            </div>
          </div>
          <div className="h-12 w-44 shrink-0 animate-pulse rounded-full bg-[#352839]/70" />
        </div>
      </div>
    </div>
  );
}

function TwitchOfflineBanner() {
  const profileImage = (
    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[#9146FF]/40 bg-[#9146FF]/15 shadow-[0_0_28px_rgba(145,70,255,0.28)] sm:h-20 sm:w-20">
      <GuideImage
        src={MINO_PROFILE_IMAGE}
        alt="Mino"
        loading="lazy"
        className="h-full w-full object-cover"
      />
    </div>
  );

  const headerBlock = (
    <div className="min-w-0">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#BF94FF]/80 sm:text-xs">
        Mino
      </p>
      <h2 className="mt-1 text-xl font-bold tracking-tight text-[#F5E6D3] sm:text-2xl">
        Catch me on stream{" "}
        <span className="inline-block animate-[wiggle_2.5s_ease-in-out_infinite]">🌸</span>
      </h2>
    </div>
  );

  const bodyText = (
    <p className="min-w-0 text-sm leading-relaxed text-[#F5E6D3]/62 sm:mt-1.5 sm:max-w-xl sm:text-base">
      I stream almost every day! Say hi, ask your questions, happy vibes only :3 Trying to make the
      League community a better place while taking their LP.
    </p>
  );

  const followButton = (
    <span className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-[#9146FF]/55 bg-[#9146FF]/20 px-5 py-3 text-sm font-bold text-[#E4CCFF] shadow-[0_0_24px_rgba(145,70,255,0.22)] transition duration-300 group-hover:border-[#B794FF]/75 group-hover:bg-[#9146FF]/30 group-hover:text-white sm:px-6 sm:text-base">
      <FaTwitch className="h-4 w-4 shrink-0" aria-hidden />
      Follow on Twitch
    </span>
  );

  return (
    <a
      href={TWITCH_CHANNEL_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-2xl border border-[#9146FF]/45 bg-[#1E1724]/80 ring-1 ring-[#9146FF]/25 transition duration-300 hover:border-[#9146FF]/70 hover:ring-[#9146FF]/45"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-90 transition duration-300 group-hover:opacity-100"
        style={{
          background: [
            "radial-gradient(ellipse 80% 120% at 0% 0%, rgba(145, 70, 255, 0.34), transparent 58%)",
            "radial-gradient(ellipse 70% 90% at 100% 100%, rgba(145, 70, 255, 0.22), transparent 55%)",
            "linear-gradient(135deg, rgba(42, 31, 46, 0.95) 0%, rgba(30, 23, 36, 0.98) 100%)",
          ].join(", "),
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-[#9146FF]/20 blur-3xl transition duration-300 group-hover:bg-[#9146FF]/30"
      />

      <div className="relative p-5 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-4 sm:hidden">
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-4">
            {profileImage}
            <div className="flex min-h-16 min-w-0 flex-col justify-center">{headerBlock}</div>
            <div className="col-span-2">{bodyText}</div>
          </div>
          <div className="flex justify-center">{followButton}</div>
        </div>

        <div className="hidden items-center justify-between gap-5 sm:flex">
          <div className="flex min-w-0 items-center gap-4">
            {profileImage}
            <div className="min-w-0">
              {headerBlock}
              {bodyText}
            </div>
          </div>
          {followButton}
        </div>
      </div>
    </a>
  );
}

function TwitchLiveEmbed({
  status,
  parentHosts,
}: {
  status: TwitchStreamStatus;
  parentHosts: string[];
}) {
  const embedUrl = useMemo(
    () => buildTwitchEmbedUrl(TWITCH_CHANNEL_LOGIN, parentHosts),
    [parentHosts]
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-[#9146FF]/40 bg-[#1E1724]/80 ring-1 ring-[#9146FF]/25">
      <div className="flex flex-col gap-3 border-b border-[#9146FF]/18 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <LiveBadge />
          </div>
          {status.title ? (
            <p className="mt-2 line-clamp-2 text-sm font-semibold text-[#F5E6D3] sm:text-base">
              {status.title}
            </p>
          ) : null}
        </div>

        <a
          href={TWITCH_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full border border-[#9146FF]/55 bg-[#9146FF]/18 px-4 py-2 text-sm font-semibold text-[#D9B8FF] transition hover:border-[#9146FF]/75 hover:bg-[#9146FF]/28 hover:text-white sm:self-center"
        >
          <FaTwitch className="h-4 w-4 shrink-0" aria-hidden />
          Open on Twitch
        </a>
      </div>

      <div className="relative aspect-video w-full bg-black">
        <iframe
          src={embedUrl}
          title={`${TWITCH_CHANNEL_DISPLAY} live on Twitch`}
          className="absolute inset-0 h-full w-full"
          allowFullScreen
        />
      </div>
    </div>
  );
}

export default function TwitchShoutoutSection({ status }: { status: TwitchStreamStatus }) {
  const [parentHosts, setParentHosts] = useState<string[]>([]);

  useEffect(() => {
    setParentHosts(getTwitchEmbedParentHosts(window.location.hostname));
  }, []);

  return (
    <section
      id="twitch"
      className={clsx("scroll-mt-24", guideSectionHeaderPadClass)}
      aria-label="Twitch stream"
    >
      {status.isLive && parentHosts.length === 0 ? (
        <TwitchShoutoutSkeleton />
      ) : status.isLive ? (
        <TwitchLiveEmbed status={status} parentHosts={parentHosts} />
      ) : (
        <TwitchOfflineBanner />
      )}
    </section>
  );
}
