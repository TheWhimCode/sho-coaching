import clsx from "clsx";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { FaTwitch } from "react-icons/fa6";
import { TWITCH_CHANNEL_URL } from "@/lib/twitch/channel";
import type { TwitchStreamStatus } from "@/lib/twitch/types";
import styles from "./BuildPickerHeader.module.css";

export default function BuildPickerHeader({ status }: { status: TwitchStreamStatus }) {
  return (
    <header className="mb-8 grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-6 sm:mb-10 lg:-mx-12 lg:grid-cols-[1fr_auto_1fr] lg:gap-x-5 xl:-mx-20">
      <Link
        href="/guide"
        className="inline-flex w-fit items-center gap-2 self-center rounded-md py-2 text-xs font-medium text-[#94A8B8] transition-colors hover:text-[#B8D8EA] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#B8D8EA] sm:text-sm"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        Back to the guide
      </Link>

      <h1 className="col-span-2 row-start-2 text-center text-2xl font-bold tracking-tight text-[#F5E6D3] sm:text-4xl lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:text-[2.25rem]">
        Build like Mino would.
      </h1>

      <a
        href={TWITCH_CHANNEL_URL}
        target="_blank"
        rel="noopener noreferrer"
        title={status.isLive ? status.title : undefined}
        className={clsx(
          "group col-start-2 row-start-1 inline-flex items-center gap-2.5 justify-self-end rounded-xl border px-3 py-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#BF94FF] lg:col-start-3",
          status.isLive
            ? "border-[#A56AE8]/55 bg-gradient-to-br from-[#9146FF] to-[#7030C4] text-[#E5D1F5] shadow-[0_4px_18px_rgba(145,70,255,0.25),inset_0_1px_0_rgba(191,148,255,0.12)] hover:from-[#9C58FF] hover:to-[#7C3BD0] hover:border-[#B17AEC]/70"
            : "border-[#BF94FF]/15 bg-[#9146FF]/[0.04] text-[#BF94FF]/75 hover:border-[#A970FF]/60 hover:bg-[#9146FF]/20 hover:text-[#B780FF]"
        )}
      >
        <FaTwitch className="h-4 w-4 shrink-0" aria-hidden />
        <span className="text-base font-semibold">
          {status.isLive ? "Live now" : "Twitch"}
        </span>
        {status.isLive ? (
          <span className="relative ml-1 flex h-2 w-2 shrink-0" aria-hidden>
            <span className={clsx("absolute inset-0 rounded-full bg-[#FF4D6D]", styles.livePulse)} />
            <span className="relative h-2 w-2 rounded-full bg-[#FF4D6D]" />
          </span>
        ) : (
          <ArrowUpRight className="h-3 w-3 shrink-0 opacity-45 transition-opacity group-hover:opacity-100" aria-hidden />
        )}
      </a>
    </header>
  );
}
