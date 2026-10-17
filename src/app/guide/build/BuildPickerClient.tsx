"use client";

import clsx from "clsx";
import { Check, ChevronDown, ChevronRight, Eye, Search } from "lucide-react";
import { possessionValueFor } from "../possessionValues";
import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import GuideImage from "@/app/_components/guides/GuideImage";
import DividerWithLogo from "@/app/_components/small/Divider-logo";
import { renderGuideHighlightedText } from "@/app/_components/guides/guideTextHighlights";
import type { CompositionFact } from "@/lib/guides/buildPicker/compositionFacts";
import type { BuildFloatTag, EnemyComposition } from "@/lib/guides/buildPicker/decisionTree";
import {
  COMPOSITION_BAR_SCALES,
  type CompositionBarScale,
} from "@/lib/guides/buildPicker/thresholds";
import { buildPickerPlayerTip } from "@/lib/guides/buildPicker/playerTip";
import {
  BUILD_PICKER_PLATFORMS,
  type BuildPickerPlatformId,
  type ChampionProfileRow,
  type LiveGameLookup,
  type LiveGameParticipant,
} from "@/lib/guides/buildPicker/types";
import type { PickerBuild, PickerItem } from "@/lib/guides/buildPicker/builds";
import { guideChampionIconImgClass, GUIDE } from "@/lib/guides/guideTheme";
import { composeMatchId } from "@/lib/riot/matchId";
import BootsLogicView from "./BootsLogicView";
import ChampionProfileTable from "./ChampionProfileTable";
import PickerLogicView from "./PickerLogicView";
import DonationPrompt from "./DonationPrompt";
import { recordBuildLookup, DONATION_LOOKUP_EVENT } from "@/lib/guides/buildPicker/donationPrompt";

const PickerTextIconsContext = createContext<Record<string, string>>({});

/** Recommended build → useful pivot when the reason you picked it stops being true. */
const BUILD_ALTERNATIVES: Record<string, { buildId: string; label: string }> = {
  "hubris-ldr": { buildId: "hubris-skip-anti-tank", label: "If you fall behind early" },
  "main-hubris": { buildId: "umbral-collector", label: "If you fall behind early" },
  "main-bastionbreaker": { buildId: "umbral-collector", label: "If your gold lines up better" },
  "yun-tal-ldr": { buildId: "hubris-ldr", label: "If you miss B. F. Sword on first reset" },
  "bastionbreaker-cyclosword": { buildId: "main-bastionbreaker", label: "If enemies end up stacking armor" },
  "collector-shieldbow": { buildId: "umbral-collector", label: "If you fall too far behind" },
  "collector-shieldbow-ga": { buildId: "umbral-collector", label: "If you fall too far behind" },
  "sit-serpents-first": { buildId: "sit-serpents", label: "If you want anti-shield later" },
  "sit-serpents-late": { buildId: "sit-serpents", label: "If you want anti-shield earlier" },
};

const STORAGE_RIOT_ID = "viego-build-picker-riot-id";
const STORAGE_PLATFORM = "viego-build-picker-platform";
const STORAGE_MODE = "viego-build-picker-mode";
const STORAGE_MATCH_ID = "viego-build-picker-match-id";

type LookupMode = "live" | "match";

function isPlatformId(value: string | null): value is BuildPickerPlatformId {
  return BUILD_PICKER_PLATFORMS.some((platform) => platform.id === value);
}

const DEFAULT_MATCH_PLATFORM = "euw1" satisfies Exclude<BuildPickerPlatformId, "auto">;

/** Match IDs need an explicit shard; live lookup can still discover the server. */
function matchLookupPlatform(platform: BuildPickerPlatformId): Exclude<BuildPickerPlatformId, "auto"> {
  return platform === "auto" ? DEFAULT_MATCH_PLATFORM : platform;
}

/** Riot IDs are 3–16 chars, tags 3–5 chars. */
const RIOT_ID_RE = /^[^#]{3,16}#[^#]{3,5}$/;
const AUTO_LOOKUP_DEBOUNCE_MS = 800;

const PANEL_CLASS =
  "rounded-2xl border border-[#F0ABCF]/15 bg-[#2A1F2E]/80 ring-1 ring-[#B8D8EA]/10 backdrop-blur-sm";

/** Frosted-glass card for the recommended build, meant to sit in front of the scene. */
const GLASS_CLASS =
  "rounded-3xl border border-white/[0.12] bg-white/[0.045] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-white/[0.04] backdrop-blur-2xl";

const LABEL_CLASS =
  "text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#B8D8EA]/70";

const COMPOSITION_BARS: { key: keyof EnemyComposition; label: string }[] = [
  { key: "durability", label: "Durability" },
  { key: "damage", label: "Damage" },
  { key: "cc", label: "CC" },
  { key: "shields", label: "Shield" },
];

/** Shared visual anchors. High sits below the top so a bar can be High without filling the chart. */
const COMPOSITION_TICKS = {
  high: 0.75,
  medium: 0.5,
  low: 0.25,
} as const;

const METER_TONE = {
  blue: {
    label: "text-[#73B3D2]",
    fill: "bg-[#73B3D2] shadow-[0_0_8px_2px_rgba(115,179,210,0.38),0_0_14px_4px_rgba(115,179,210,0.2)]",
  },
  orange: {
    label: "text-[#C4895C]",
    fill: "bg-[#C4895C] shadow-[0_0_8px_2px_rgba(196,137,92,0.28),0_0_14px_4px_rgba(196,137,92,0.14)]",
  },
  red: {
    label: "text-[#FF526C]",
    fill: "bg-[#FF526C] shadow-[0_0_8px_2px_rgba(255,82,108,0.34),0_0_14px_4px_rgba(255,82,108,0.18)]",
  },
} as const;

function meterTone(value: number, scale: CompositionBarScale) {
  if (value >= scale.high) return METER_TONE.red;
  if (value >= scale.medium) return METER_TONE.orange;
  return METER_TONE.blue;
}

function lerp(value: number, start: number, end: number, from: number, to: number) {
  if (end === start) return to;
  return from + ((value - start) / (end - start)) * (to - from);
}

function barHeight(value: number, scale: CompositionBarScale) {
  if (value <= 0) return 0;
  const v = Math.min(value, scale.max);
  if (v <= scale.low) return lerp(v, 0, scale.low, 0, COMPOSITION_TICKS.low);
  if (v <= scale.medium) {
    return lerp(v, scale.low, scale.medium, COMPOSITION_TICKS.low, COMPOSITION_TICKS.medium);
  }
  if (v <= scale.high) {
    return lerp(v, scale.medium, scale.high, COMPOSITION_TICKS.medium, COMPOSITION_TICKS.high);
  }
  return lerp(v, scale.high, scale.max, COMPOSITION_TICKS.high, 1);
}

function CompositionChart({ composition }: { composition: EnemyComposition }) {
  const ticks = [
    { height: COMPOSITION_TICKS.high, label: "High", tone: METER_TONE.red.label },
    { height: COMPOSITION_TICKS.medium, label: "Medium", tone: METER_TONE.orange.label },
    { height: COMPOSITION_TICKS.low, label: "Low", tone: METER_TONE.blue.label },
  ] as const;

  return (
    <div className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 sm:gap-x-4">
      <div className="relative h-40 w-[4.25rem] sm:h-48 sm:w-[4.75rem]">
        {ticks.map((tick) => (
          <span
            key={tick.label}
            className={clsx(
              "absolute right-0 -translate-y-1/2 text-[0.58rem] font-bold uppercase tracking-[0.15em]",
              tick.tone
            )}
            style={{ top: `${(1 - tick.height) * 100}%` }}
          >
            {tick.label}
          </span>
        ))}
      </div>
      <div className="relative h-40 sm:h-48">
        {ticks.map((tick) => (
          <div
            key={tick.label}
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 border-t border-[#F5E6D3]/10"
            style={{ top: `${(1 - tick.height) * 100}%` }}
          />
        ))}
        <div className="flex h-full items-end gap-2 sm:gap-3">
          {COMPOSITION_BARS.map((bar) => {
            const value = composition[bar.key];
            const scale = COMPOSITION_BAR_SCALES[bar.key];
            const height = barHeight(value, scale);
            const tone = meterTone(value, scale);
            return (
              <div
                key={bar.key}
                className="flex h-full min-w-0 flex-1 items-end justify-center"
                aria-label={`${bar.label}: ${value}`}
              >
                {height > 0 ? (
                  <div
                    className={clsx("w-5 transition-[height] duration-300 sm:w-6", tone.fill)}
                    style={{ height: `${height * 100}%` }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      <div />
      <div className="flex gap-2 sm:gap-3">
        {COMPOSITION_BARS.map((bar) => (
          <span
            key={bar.key}
            className="min-w-0 flex-1 text-center text-[0.52rem] font-bold uppercase leading-tight tracking-[0.12em] text-[#F5E6D3]/55 sm:text-[0.58rem]"
          >
            {bar.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function pickerItem(itemId: number, builds: PickerBuild[], bootItems: PickerItem[]) {
  return bootItems.find((item) => item.id === itemId)
    ?? builds.flatMap((build) => build.items).find((item) => item.id === itemId);
}

function CompositionFacts({
  facts,
  builds,
  bootItems,
}: {
  facts: CompositionFact[];
  builds: PickerBuild[];
  bootItems: PickerItem[];
}) {
  if (facts.length === 0) return null;
  return (
    <ul className="mt-5 space-y-2.5 max-sm:px-5">
      {facts.map((fact) => {
        const item = pickerItem(fact.itemId, builds, bootItems);
        const excluded = fact.tone === "exclude";
        return (
          <li key={fact.id} className="flex items-center gap-3">
            <div
              className={clsx(
                "relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-[#352839] sm:h-9 sm:w-9",
                excluded ? "ring-1 ring-[#E07070]/55" : "ring-1 ring-[#F0ABCF]/35"
              )}
              title={excluded ? `${item?.name ?? "Item"} skipped` : item?.name}
            >
              {item ? (
                <GuideImage
                  src={item.icon}
                  alt={item.name}
                  fade={false}
                  className={clsx("h-full w-full object-cover", excluded && "opacity-40 saturate-50")}
                />
              ) : null}
              {excluded ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-[-10%] top-1/2 h-[2px] w-[120%] -translate-y-1/2 -rotate-45 bg-[#E07070]"
                />
              ) : null}
            </div>
            <p
              className={clsx(
                "min-w-0 flex-1 text-left text-xs font-medium sm:text-sm",
                excluded ? "text-[#E8A0A0]/80" : "text-[#F5E6D3]/70"
              )}
            >
              {fact.label}
            </p>
            <div className="flex shrink-0 items-center gap-1.5">
              {fact.champions.map((champion) => (
                <div
                  key={champion.championId}
                  className="h-8 w-8 overflow-hidden rounded-lg bg-[#352839] ring-1 ring-[#F0ABCF]/25 sm:h-9 sm:w-9"
                  title={champion.championName}
                >
                  <GuideImage
                    src={champion.championIcon}
                    alt={champion.championName}
                    fade={false}
                    className={guideChampionIconImgClass}
                  />
                </div>
              ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function BuildWhyPanel({
  build,
  builds,
  boot,
  bootSlot,
  bootItems,
  composition,
  facts,
  alternates,
}: {
  build: PickerBuild | undefined;
  builds: PickerBuild[];
  boot?: PickerItem;
  bootSlot: 2 | 3 | 4;
  bootItems: PickerItem[];
  composition?: EnemyComposition;
  facts?: CompositionFact[];
  alternates?: { buildId: string; reason: string }[];
}) {
  const routes = (alternates ?? []).flatMap((route) => {
    const altBuild = builds.find((entry) => entry.id === route.buildId);
    return altBuild ? [{ ...route, build: altBuild }] : [];
  });
  const guideTextIcons = useContext(PickerTextIconsContext);

  return (
    <div className="mt-7 border-t border-[#B8D8EA]/18 bg-[#120F19]/95 px-0 pb-4 pt-7 text-left sm:px-10 sm:pb-6 sm:pt-9">
      <p className="text-[0.58rem] font-bold uppercase tracking-[0.15em] text-[#B8D8EA]/68 max-sm:px-5">How the build was picked</p>
      {composition ? <CompositionChart composition={composition} /> : null}
      {facts?.length ? <CompositionFacts facts={facts} builds={builds} bootItems={bootItems} /> : null}

      {build?.description ? (
        <>
          <div className="my-7 h-px w-full bg-gradient-to-r from-transparent via-[#F0ABCF]/30 to-transparent" />
          <div className="mb-4 flex w-full flex-wrap items-center justify-start gap-x-4 gap-y-2 max-sm:px-5">
            <h3 className="text-base font-bold tracking-tight text-[#FAD4E8]/85">{build.label}</h3>
            <ItemOrder build={build} boot={boot} bootSlot={bootSlot} size="xs" showNumbers={false} />
          </div>
          <div className="max-w-4xl text-sm leading-relaxed text-[#F5E6D3]/68 max-sm:px-5 sm:text-[0.95rem]">
            {build.description.split("\n").filter(Boolean).map((paragraph) => (
              <p key={paragraph} className="mt-2 first:mt-0">{renderGuideHighlightedText(paragraph, guideTextIcons)}</p>
            ))}
          </div>
        </>
      ) : null}

      {routes.length ? (
        <>
          <div className="my-7 h-px w-full bg-gradient-to-r from-transparent via-[#F0ABCF]/30 to-transparent" />
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.15em] text-[#F5E6D3]/48 max-sm:px-5">
            {routes.length === 1 ? "Alternative build" : "Alternative builds"}
          </p>
          <div className="mt-3 divide-y divide-[#F5E6D3]/10">
            {routes.map((route) => (
              <div
                key={route.build.id}
                className="grid gap-6 py-7 opacity-50 grayscale transition duration-300 hover:opacity-80 hover:grayscale-0 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:items-center sm:gap-8"
              >
                <div className="max-sm:px-5">
                  <p className="text-base font-bold tracking-tight text-[#F5E6D3]">{route.build.label}</p>
                  <p className="mt-3 text-xs font-medium leading-relaxed text-[#FFB3C1]">{route.reason}</p>
                </div>
                <div className="min-w-0">
                  <ItemOrder build={route.build} boot={boot} bootSlot={bootSlot} size="sm" noWrap />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

type LookupPhase = "idle" | "verifying" | "searching";

function ServerPicker({
  platform,
  onChange,
  allowAuto = true,
}: {
  platform: BuildPickerPlatformId;
  onChange: (platform: BuildPickerPlatformId) => void;
  allowAuto?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const options = allowAuto
    ? BUILD_PICKER_PLATFORMS
    : BUILD_PICKER_PLATFORMS.filter((entry) => entry.id !== "auto");
  const selected =
    options.find((entry) => entry.id === platform) ?? options[0] ?? BUILD_PICKER_PLATFORMS[1];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative w-full shrink-0 sm:w-auto">
      <button
        type="button"
        aria-label={`Server, ${selected.label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-12 w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-[#F5E6D3] transition hover:bg-white/[0.08] sm:w-auto sm:min-w-[8.75rem]"
      >
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#B8D8EA]/55">Server</span>
          <span className="truncate">{selected.label}</span>
        </span>
        <ChevronDown className={clsx("h-4 w-4 shrink-0 text-[#F5E6D3]/55 transition", open && "rotate-180")} aria-hidden />
      </button>
      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-label="Server"
          className="absolute left-0 z-40 mt-2 grid max-h-72 w-full grid-cols-3 gap-1 overflow-y-auto rounded-2xl border border-white/10 bg-[#1A1520]/95 p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:left-auto sm:right-0 sm:w-[16.5rem]"
        >
          {options.map((entry) => {
            const active = entry.id === selected.id;
            return (
              <button
                key={entry.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(entry.id);
                  setOpen(false);
                }}
                className={clsx(
                  "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-semibold transition",
                  entry.id === "auto" && "col-span-3 justify-between px-3",
                  active
                    ? "bg-[#F0ABCF] text-[#2A1F2E]"
                    : "text-[#F5E6D3]/80 hover:bg-white/[0.06] hover:text-[#F5E6D3]"
                )}
              >
                <span>{entry.label}</span>
                {active ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function SplitSubmit({
  disabled,
  busy,
  label,
  otherModeLabel,
  onSwitchMode,
}: {
  disabled: boolean;
  busy: boolean;
  label: string;
  otherModeLabel: string;
  onSwitchMode: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);

  const cancelClose = () => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => () => cancelClose(), []);

  return (
    <div ref={rootRef} className="relative w-full shrink-0 sm:w-auto">
      <div
        className={clsx(
          "relative flex h-12 w-full items-stretch rounded-2xl text-sm font-semibold transition sm:inline-flex sm:w-auto",
          "bg-[#F0ABCF] text-[#2A1F2E]",
          !(disabled || busy) && "hover:bg-[#FAD4E8]",
          (disabled || busy) && "bg-[#F0ABCF]/25 text-[#F5E6D3]/45",
          busy && "cursor-not-allowed"
        )}
      >
        <div
          className="group relative"
          onMouseEnter={() => {
            cancelClose();
            setOpen(true);
          }}
          onMouseLeave={() => {
            if (rootRef.current?.contains(document.activeElement)) return;
            scheduleClose();
          }}
        >
          <button
            type="button"
            aria-label={otherModeLabel}
            aria-haspopup="menu"
            aria-expanded={open}
            disabled={busy}
            onClick={() => {
              cancelClose();
              setOpen(true);
            }}
            className={clsx(
              "relative inline-flex h-12 items-center pl-4 pr-1.5",
              busy && "cursor-not-allowed"
            )}
          >
            <ChevronRight
              className={clsx(
                "relative h-4 w-4 transition-transform duration-200 group-hover:rotate-90",
                open && "rotate-90"
              )}
              aria-hidden
            />
          </button>
          {open ? (
            <div className="absolute left-0 top-full z-40 pt-2">
              <div
                role="menu"
                className="min-w-[13.5rem] rounded-2xl border border-white/10 bg-[#1A1520]/95 p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onSwitchMode();
                    setOpen(false);
                  }}
                  className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#F5E6D3]/85 transition hover:bg-white/[0.06] hover:text-[#F5E6D3]"
                >
                  {otherModeLabel}
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={disabled || busy}
          className={clsx(
            "inline-flex h-12 flex-1 items-center justify-start whitespace-nowrap px-1 text-left sm:w-auto sm:flex-none sm:pl-0.5 sm:pr-5",
            (disabled || busy) && "cursor-not-allowed"
          )}
        >
          {label}
        </button>
      </div>
    </div>
  );
}

function LookupForm({
  mode,
  riotId,
  matchId,
  platform,
  busy,
  cuePreviousGame,
  onModeChange,
  onRiotIdChange,
  onMatchIdChange,
  onPlatformChange,
  onSubmit,
}: {
  mode: LookupMode;
  riotId: string;
  matchId: string;
  platform: BuildPickerPlatformId;
  busy: boolean;
  cuePreviousGame?: boolean;
  onModeChange: (mode: LookupMode) => void;
  onRiotIdChange: (value: string) => void;
  onMatchIdChange: (value: string) => void;
  onPlatformChange: (platform: BuildPickerPlatformId) => void;
  onSubmit: () => void;
}) {
  const live = mode === "live";
  const matchPlatform = matchLookupPlatform(platform);
  const valid = live ? RIOT_ID_RE.test(riotId.trim()) : Boolean(composeMatchId(matchId, matchPlatform));
  const inputRef = useRef<HTMLInputElement>(null);
  const skipFocusOnMount = useRef(true);

  useEffect(() => {
    if (skipFocusOnMount.current) {
      skipFocusOnMount.current = false;
      return;
    }
    inputRef.current?.focus();
  }, [mode]);

  return (
    <>
    <form
      className={clsx(GLASS_CLASS, "relative z-30 flex flex-col gap-2 p-2 sm:flex-row sm:items-center sm:gap-2 sm:p-2")}
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div
        className={clsx(
          "relative flex min-w-0 flex-1 items-center rounded-2xl transition",
          cuePreviousGame && live && "bg-[#F0ABCF]/12 ring-2 ring-[#F0ABCF]"
        )}
      >
        <Search className="pointer-events-none absolute left-4 h-4 w-4 text-[#F5E6D3]/35" aria-hidden />
        {live ? (
          <input
            key="live"
            ref={inputRef}
            id="build-picker-riot-id"
            aria-label="Riot ID"
            aria-describedby={cuePreviousGame ? "build-picker-not-in-game" : undefined}
            value={riotId}
            onChange={(event) => onRiotIdChange(event.target.value)}
            placeholder="Riot#TAG"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            inputMode="text"
            className="h-12 w-full bg-transparent pl-11 pr-4 text-base text-[#F5EDE6] outline-none placeholder:text-[#F5E6D3]/35"
          />
        ) : (
          <input
            key="match"
            ref={inputRef}
            id="build-picker-match-id"
            aria-label="Match ID"
            value={matchId}
            onChange={(event) => onMatchIdChange(event.target.value)}
            placeholder="7094182635 — Game IDs are in match histories"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            inputMode="text"
            className="h-12 w-full bg-transparent pl-11 pr-4 text-base text-[#F5EDE6] outline-none placeholder:text-[#F5E6D3]/35"
          />
        )}
      </div>
      <div className="grid w-full grid-cols-2 gap-2 sm:contents">
        <div className="sm:contents">
          <ServerPicker platform={live ? platform : matchPlatform} onChange={onPlatformChange} allowAuto={live} />
        </div>
        <div className="sm:contents">
          <SplitSubmit
            disabled={!valid}
            busy={busy}
            label={live ? "Find my game" : "Check this game"}
            otherModeLabel={live ? "Check previous game" : "Find live game"}
            onSwitchMode={() => onModeChange(live ? "match" : "live")}
          />
        </div>
      </div>
    </form>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Teams                                                               */
/* ------------------------------------------------------------------ */

/**
 * Portraits sit directly on the page background, no panel. Ally team on the
 * left with spells to the right of each portrait; enemy team on the right
 * with spells to the left, so both columns face the build in the middle.
 */
const PORTRAIT_CLASS = "h-14 w-14 sm:h-16 sm:w-16 lg:h-[4.5rem] lg:w-[4.5rem]";
const SPELL_CLASS = "h-6 w-6 sm:h-7 sm:w-7";
/**
 * Left 1, left 2, right 1, left 3, right 2, and so on, then the last right portrait.
 * Steps overlap; the right column is two beats behind the left.
 */
const PORTRAIT_REVEAL_STEP_MS = 55;
const PORTRAIT_REVEAL_DURATION_MS = 280;
const PORTRAIT_REVEAL_COUNT = 5;
const PORTRAIT_REVEAL_LAST_STEP = PORTRAIT_REVEAL_COUNT * 2 - 1;
/** First tag starts a little before the last portrait fade finishes. */
const FLOAT_TAG_LEAD_MS = 120;
const FLOAT_TAG_START_MS =
  PORTRAIT_REVEAL_LAST_STEP * PORTRAIT_REVEAL_STEP_MS + PORTRAIT_REVEAL_DURATION_MS - FLOAT_TAG_LEAD_MS;

function portraitRevealStep(side: "ally" | "enemy", index: number, count = PORTRAIT_REVEAL_COUNT) {
  if (side === "ally") return index <= 0 ? 0 : index * 2 - 1;
  if (index >= count - 1) return count * 2 - 1;
  return (index + 1) * 2;
}

const FLOAT_COLOR: Record<BuildFloatTag["tone"], string> = {
  shield: "#F8F7F5",
  barrier: "#D6B6F0",
  damage: "#55D0B6",
  tank: "#CBC9C6",
  bruiser: "#E8924C",
  squishy: "#8AC4F7",
  survive: "#F590B4",
  ad: "#E05A42",
  ap: "#B888E8",
  cc: "#F07090",
  disengage: "#F0C050",
};

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index++) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function floatTagKey(tag: BuildFloatTag) {
  return `${tag.side}:${tag.championId}:${tag.word}`;
}

/** Disc around a point slightly above the portrait center. Seeded so SSR and the client land on the same pixel. */
const FLOAT_SPAWN_RADIUS_PX = 42;

function unitFromSeed(seed: string) {
  return hashSeed(seed) / 4_294_967_296;
}

function rollAroundCenter(seed: string) {
  const angle = unitFromSeed(`${seed}:angle`) * Math.PI * 2;
  const distance = Math.sqrt(unitFromSeed(`${seed}:radius`)) * FLOAT_SPAWN_RADIUS_PX;
  return {
    x: Math.round(Math.cos(angle) * distance),
    y: Math.round(Math.sin(angle) * distance),
  };
}

/** Random order, with a short gap so the tags don't pop in as one group. */
const FLOAT_TAG_GAP_MS = 80;
const FLOAT_TAG_GAP_JITTER_MS = 40;

function floatAppearDelays(tags: BuildFloatTag[]) {
  const ordered = [...tags].sort((a, b) => hashSeed(floatTagKey(a)) - hashSeed(floatTagKey(b)));
  const delays: Record<string, number> = {};
  let cursor = FLOAT_TAG_START_MS;
  for (const tag of ordered) {
    delays[floatTagKey(tag)] = cursor;
    cursor += FLOAT_TAG_GAP_MS + (hashSeed(`${floatTagKey(tag)}:gap`) % FLOAT_TAG_GAP_JITTER_MS);
  }
  return delays;
}

function PortraitFloats({ tags, appearDelays }: { tags: BuildFloatTag[]; appearDelays: Record<string, number> }) {
  if (tags.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20" aria-hidden>
      {tags.map((entry, index) => {
        const spot = rollAroundCenter(floatTagKey(entry));
        // Keep multi-tag labels compact; use a shorter drift to preserve separation.
        const y = tags.length > 1 ? (index - (tags.length - 1) / 2) * 26 : spot.y;
        return (
          <span
            key={floatTagKey(entry)}
            className="absolute left-1/2 top-[40%] whitespace-nowrap"
            style={{ transform: `translate(calc(-50% + ${spot.x}px), calc(-50% + ${y}px))` }}
          >
            <span
              className="build-float-tag inline-block text-[16px] font-extrabold uppercase leading-none tracking-[0.06em]"
              style={{
                color: FLOAT_COLOR[entry.tone],
                fontSize: "16px",
                textShadow: "-1px -1px 0 rgba(8,6,12,0.98), 1px -1px 0 rgba(8,6,12,0.98), -1px 1px 0 rgba(8,6,12,0.98), 1px 1px 0 rgba(8,6,12,0.98), 0 0 7px rgba(8,6,12,1), 0 0 15px rgba(8,6,12,0.9)",
                animationDelay: `${appearDelays[floatTagKey(entry)] ?? FLOAT_TAG_START_MS}ms`,
                ...(tags.length > 1 ? { "--build-float-rise": "-8px" } : {}),
              }}
            >
              {entry.word}
            </span>
          </span>
        );
      })}
    </div>
  );
}

function PortraitScores({
  side,
  durability,
  damage,
}: {
  side: "ally" | "enemy";
  durability?: number | null;
  damage?: number | null;
}) {
  if (durability == null && damage == null) return null;
  return (
    <div
      className={clsx(
        "pointer-events-none absolute top-1/2 hidden -translate-y-1/2 flex-col items-center gap-0.5 text-[11px] font-semibold leading-none tabular-nums lg:flex",
        side === "enemy" ? "left-full ml-2" : "right-full mr-2"
      )}
      aria-hidden
    >
      <span className="text-[#B8D8EA]" style={{ textShadow: "0 1px 2px rgba(8,6,12,0.9)" }}>{durability ?? "—"}</span>
      <span className="text-[#C84A32]" style={{ textShadow: "0 1px 2px rgba(8,6,12,0.9)" }}>{damage ?? "—"}</span>
    </div>
  );
}

function PossessionReveal({ champion }: { champion: string }) {
  const value = possessionValueFor(champion);
  if (value == null) return null;
  const tone = value === 10
    ? { border: "#E8C56B", score: "#FFE8A0", glow: "0 0 20px rgba(232,197,107,0.42)" }
    : value >= 8
      ? { border: "#E78BC0", score: "#FFD0E6", glow: "0 0 18px rgba(240,171,207,0.38)" }
      : value >= 6
        ? { border: "#73B3D2", score: "#B8E4F7", glow: "0 0 12px rgba(115,179,210,0.16)" }
        : value >= 4
          ? { border: "#71838E", score: "#91A2AD", glow: "none" }
          : { border: "#756B65", score: "#92847A", glow: "none" };
  return (
    <div className="possession-reveal pointer-events-none absolute -inset-[5px] z-10">
      {[56, 64, 72].map((size, index) => {
        const edge = size + 9;
        const corner = edge - 16;
        return (
          <svg key={size} className={clsx("absolute inset-0 h-full w-full overflow-visible", index === 0 ? "sm:hidden" : index === 1 ? "hidden sm:block lg:hidden" : "hidden lg:block")} viewBox={`0 0 ${size + 10} ${size + 10}`} fill="none" aria-hidden style={{ color: tone.border }}>
            <path className="possession-border" pathLength={1} d={`M 1 ${corner} L 1 17 A 16 16 0 0 1 17 1 L ${corner} 1 A 16 16 0 0 1 ${edge} 17`} stroke="currentColor" strokeWidth="2" />
            <path className="possession-border" pathLength={1} d={`M 1 ${corner} A 16 16 0 0 0 17 ${edge} L ${corner} ${edge} A 16 16 0 0 0 ${edge} ${corner} L ${edge} 17`} stroke="currentColor" strokeWidth="2" />
          </svg>
        );
      })}
      <span className="possession-score absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#120F19]/90 px-1.5 py-0.5 text-xs font-extrabold tabular-nums" style={{ color: tone.score, textShadow: tone.glow }} aria-label={`${champion} possession: ${value} out of 10`}>
        {value}<span className="text-[9px] opacity-65">/10</span>
      </span>
    </div>
  );
}

function TeamColumn({
  title,
  side,
  participants,
  floatTags = [],
  appearDelays = {},
  showScores = false,
}: {
  title: string;
  side: "ally" | "enemy";
  participants: LiveGameParticipant[];
  floatTags?: BuildFloatTag[];
  appearDelays?: Record<string, number>;
  showScores?: boolean;
}) {
  const accent = side === "ally" ? GUIDE.lightBlue : GUIDE.pink;
  const enemy = side === "enemy";
  return (
    <div className={clsx("flex flex-col", enemy ? "items-end" : "items-start")}>
      <p className={clsx(LABEL_CLASS, "flex w-14 justify-center whitespace-nowrap text-center sm:w-16 lg:w-[4.5rem]")} style={{ color: accent }}>
        {title}
      </p>
      <ul className="mt-4 flex flex-col gap-3 sm:gap-3.5">
        {participants.map((participant, index) => {
          const revealDelay = `${portraitRevealStep(side, index, participants.length) * PORTRAIT_REVEAL_STEP_MS}ms`;
          return (
          <li
            key={`${participant.championId}-${participant.isSearchedPlayer}`}
            className={clsx("flex items-center gap-2", enemy && "flex-row-reverse")}
            title={
              participant.isSearchedPlayer && participant.riotId
                ? `${participant.championName} · ${participant.riotId}`
                : participant.championName
            }
          >
            <div className={clsx("relative shrink-0", PORTRAIT_CLASS)}>
              <div
                className={clsx(
                  "h-full w-full overflow-hidden rounded-xl bg-[#352839] ring-1 transition",
                  participant.isSearchedPlayer
                    ? "ring-2 ring-[#F0ABCF] shadow-[0_0_24px_rgba(240,171,207,0.45)]"
                    : enemy
                      ? "ring-[#F0ABCF]/30 shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
                      : "ring-[#B8D8EA]/30 shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
                )}
              >
                <GuideImage
                  src={participant.championIcon}
                  alt={participant.championName}
                  fade={false}
                  className={clsx(guideChampionIconImgClass, "build-portrait-in")}
                  style={{ animationDelay: revealDelay }}
                />
              </div>
              <PortraitFloats
                tags={floatTags.filter((entry) => entry.championId === participant.championId)}
                appearDelays={appearDelays}
              />
              {enemy ? <PossessionReveal champion={participant.championId} /> : null}
              {showScores ? (
                <PortraitScores
                  side={side}
                  durability={participant.durabilityScore}
                  damage={participant.damageScore}
                />
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              {participant.spells.map((spellEntry) => (
                <div
                  key={spellEntry.id}
                  className={clsx(
                    "overflow-hidden rounded-md bg-[#352839] ring-1 ring-[#F5E6D3]/15 shadow-[0_4px_12px_rgba(0,0,0,0.4)]",
                    SPELL_CLASS
                  )}
                  title={spellEntry.key}
                >
                  {spellEntry.icon ? (
                    <GuideImage
                      src={spellEntry.icon}
                      alt={spellEntry.key}
                      fade={false}
                      className="build-portrait-in h-full w-full object-cover"
                      style={{ animationDelay: revealDelay }}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </li>
          );
        })}
      </ul>
    </div>
  );
}

function TeamColumnSkeleton({ side }: { side: "ally" | "enemy" }) {
  const enemy = side === "enemy";
  return (
    <div className={clsx("flex flex-col", enemy ? "items-end" : "items-start")} aria-hidden>
      <p className={clsx(LABEL_CLASS, "relative flex w-14 justify-center whitespace-nowrap text-center sm:w-16 lg:w-[4.5rem]")}>
        <span className="text-transparent">{enemy ? "Enemy team" : "Your team"}</span>
        <span className="absolute inset-x-0 top-1/2 h-[0.55em] -translate-y-1/2 animate-pulse rounded-full bg-[#F5E6D3]/[0.12]" />
      </p>
      <ul className="mt-4 flex flex-col gap-3 sm:gap-3.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <li key={index} className={clsx("flex items-center gap-2", enemy && "flex-row-reverse")}>
            <div
              className={clsx(
                "shrink-0 rounded-xl bg-[#352839] ring-1 ring-[#F5E6D3]/20 shadow-[0_8px_24px_rgba(0,0,0,0.45)]",
                PORTRAIT_CLASS
              )}
            />
            <div className="flex shrink-0 flex-col gap-1">
              <div className={clsx("rounded-md bg-[#352839] ring-1 ring-[#F5E6D3]/15 shadow-[0_4px_12px_rgba(0,0,0,0.4)]", SPELL_CLASS)} />
              <div className={clsx("rounded-md bg-[#352839] ring-1 ring-[#F5E6D3]/15 shadow-[0_4px_12px_rgba(0,0,0,0.4)]", SPELL_CLASS)} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Three-column stage: ally portraits · build · enemy portraits. */
function Stage({
  left,
  center,
  right,
  caption,
  busy,
  mobileControls,
}: {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  caption?: ReactNode;
  busy?: boolean;
  mobileControls?: ReactNode;
}) {
  return (
    <section className="relative lg:-mx-12 xl:-mx-20" aria-busy={busy || undefined}>
      {/* Mobile: label (15px), margin (16px), two 68px rows, half a 56px portrait. */}
      {mobileControls ? <div className="absolute left-1/2 top-[195px] z-30 -translate-x-1/2 -translate-y-1/2 sm:hidden">{mobileControls}</div> : null}
      {caption ? <div className="pointer-events-none absolute bottom-full left-0 right-0 mb-3 flex justify-center">{caption}</div> : null}
      <div className="grid grid-cols-2 items-start gap-x-6 gap-y-8 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-x-8 lg:gap-x-14">
        <div className="order-1 sm:pt-10">{left}</div>
        <div className="order-3 col-span-2 -mx-5 sm:order-2 sm:col-span-1 sm:mx-0">{center}</div>
        <div className="order-2 sm:order-3 sm:pt-10">{right}</div>
      </div>
    </section>
  );
}

function PhaseCaption({ phase, mode }: { phase: LookupPhase; mode: LookupMode }) {
  const label =
    mode === "match"
      ? "Looking up that game…"
      : phase === "verifying"
        ? "Verifying Riot ID…"
        : "Looking for your game…";
  return (
    <p className="flex items-center gap-2 text-xs text-[#F5E6D3]/60" role="status">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F0ABCF]/60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F0ABCF]" />
      </span>
      {label}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Recommended build                                                   */
/* ------------------------------------------------------------------ */

/** Item-order blurbs like "Collector, LDR, Infinity Edge" sit above the icons and repeat them. */
function isItemListSummary(summary: string) {
  return summary.split(",").length >= 4;
}

function ItemOrder({
  build,
  boot,
  bootSlot,
  size = "md",
  noWrap = false,
  showNumbers = true,
}: {
  build: PickerBuild;
  boot?: PickerItem;
  bootSlot?: 2 | 3 | 4;
  size?: "md" | "sm" | "xs";
  noWrap?: boolean;
  showNumbers?: boolean;
}) {
  const tile = size === "xs" ? "h-[min(1.375rem,6vw)] w-[min(1.375rem,6vw)] sm:h-6 sm:w-6" : size === "sm" ? "h-[min(2.75rem,12vw)] w-[min(2.75rem,12vw)] sm:h-12 sm:w-12" : "h-[min(4rem,13vw)] w-[min(4rem,13vw)] sm:h-[4.5rem] sm:w-[4.5rem]";
  const items = [...build.items];
  if (boot && bootSlot) items.splice(bootSlot - 1, 0, boot);
  return (
    <ol aria-label={`${build.label} item order`} className={clsx("flex flex-nowrap gap-y-4", size === "xs" ? "justify-start gap-x-1 sm:gap-x-2.5" : "justify-center gap-x-2 sm:gap-x-5", !noWrap && "sm:flex-wrap")}>
      {items.map((item, index) => (
        <li key={`${index}-${item.id}`} className="flex flex-col items-center gap-1.5">
          {showNumbers ? <span className="text-[10px] font-medium tabular-nums text-[#B8D8EA]/65">{index + 1}</span> : null}
          <div
            className={clsx(
              "overflow-hidden",
              size === "xs" ? "relative rounded-md bg-[#352839]" : "rounded-xl bg-[#352839] ring-1 ring-[#F0ABCF]/40",
              size === "md" && "shadow-[0_0_22px_rgba(240,171,207,0.22),0_10px_30px_rgba(0,0,0,0.45)]",
              tile
            )}
            title={item.name}
          >
            <GuideImage src={item.icon} alt={item.name} className={clsx("h-full w-full object-cover", size === "xs" && "opacity-[0.65] sepia-[0.65] saturate-50")} />
            {size === "xs" ? <span aria-hidden className="pointer-events-none absolute inset-0 bg-[#9C7058]/25 mix-blend-color" /> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function BuildCard({
  build,
  buildId,
  builds,
  bootItems,
  boot,
  recommendedAlternative,
  alternates,
  player,
  source,
  composition,
  facts,
  possessionsPinned,
  onTogglePossessions,
}: {
  build: PickerBuild | undefined;
  buildId: string;
  builds: PickerBuild[];
  bootItems: PickerItem[];
  boot: { itemId: number; slot: 2 | 3 | 4 };
  recommendedAlternative?: { buildId: string; label: string };
  alternates?: { buildId: string; reason: string }[];
  player?: LiveGameParticipant;
  source?: "live" | "match";
  composition?: EnemyComposition;
  facts?: CompositionFact[];
  possessionsPinned: boolean;
  onTogglePossessions: () => void;
}) {
  const playerTip = buildPickerPlayerTip(player);
  const alternative = recommendedAlternative ?? BUILD_ALTERNATIVES[buildId];
  const alternativeBuild = alternative
    ? builds.find((entry) => entry.id === alternative.buildId)
    : undefined;
  const selectedBoot = bootItems.find((item) => item.id === boot.itemId);
  const [whyOpen, setWhyOpen] = useState(false);

  return (
    <section
      className={clsx(GLASS_CLASS, "relative overflow-hidden px-0 py-6 max-sm:rounded-none max-sm:border-x-0 sm:p-8 lg:p-10")}
      style={whyOpen ? { paddingBottom: 0 } : undefined}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 0%, rgba(240, 171, 207, 0.16), transparent 65%), radial-gradient(ellipse 60% 50% at 50% 34rem, rgba(184, 216, 234, 0.08), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#FAD4E8]/60 to-transparent"
      />
      <div className="relative flex flex-col items-center text-center">
        <button
          type="button"
          aria-pressed={possessionsPinned}
          onClick={onTogglePossessions}
          className="possession-toggle absolute right-0 top-0 z-10 hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[11px] font-semibold text-[#F5E6D3] transition hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F0ABCF] aria-pressed:bg-white/[0.08] sm:inline-flex"
        >
          <Eye aria-hidden className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">Possessions</span>
        </button>
        <p className={LABEL_CLASS}>{source === "match" ? "What I would have built" : "Recommended build"}</p>
        {playerTip ? (
          <p className="mt-3 rounded-full border border-[#B8D8EA]/20 bg-[#B8D8EA]/[0.07] px-3 py-1.5 text-xs font-medium text-[#B8D8EA]/85" role="status">
            {playerTip}
          </p>
        ) : null}
        {build ? (
          <>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#FAD4E8] sm:text-3xl lg:text-[2.1rem]">
              {build.label}
            </h2>
            {build.summary ? (
              <p className="mt-1.5 text-sm text-[#F5E6D3]/60 sm:text-base">{build.summary}</p>
            ) : null}
            <div className="mt-7 w-full sm:w-auto">
              <ItemOrder build={build} boot={selectedBoot} bootSlot={boot.slot} />
            </div>
          </>
        ) : (
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#FAD4E8]">
            Unknown build &ldquo;{buildId}&rdquo;
          </h2>
        )}

        <div className="w-full">
          <DividerWithLogo className="mb-7 mt-8" color="rgba(240,171,207,0.30)" />
          {alternativeBuild && alternative ? (
            <>
              <p className={LABEL_CLASS}>{alternative.label}</p>
              <p className="mt-1.5 text-lg font-bold tracking-tight text-[#F5E6D3]/85">{alternativeBuild.label}</p>
              {alternativeBuild.summary && !isItemListSummary(alternativeBuild.summary) ? (
                <p className="mt-1 text-xs text-[#F5E6D3]/50 sm:text-sm">{alternativeBuild.summary}</p>
              ) : null}
              <div className="mt-4">
                <ItemOrder build={alternativeBuild} boot={selectedBoot} bootSlot={boot.slot} size="sm" />
              </div>
            </>
          ) : (
            <>
              <p className={LABEL_CLASS}>Alternative build</p>
              <p className="mt-1.5 text-lg font-bold tracking-tight text-[#F5E6D3]/85">No alternative is good here</p>
              <p className="mt-1 text-xs text-[#F5E6D3]/50 sm:text-sm">Stay on this build.</p>
              <div className="mt-4 flex justify-center gap-x-3 sm:gap-x-5" aria-hidden>
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="flex flex-col items-center gap-1.5">
                    <span className="invisible text-[10px] font-medium tabular-nums">1</span>
                    <div className="h-11 w-11 rounded-xl sm:h-12 sm:w-12" />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setWhyOpen((open) => !open)}
          aria-expanded={whyOpen}
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#B8D8EA] transition hover:text-[#FAD4E8]"
        >
          {whyOpen ? "Hide breakdown" : "Want to know why?"}
        </button>
        <div className={clsx("grid w-full transition-[grid-template-rows,opacity] duration-500 ease-out sm:-mx-8 sm:w-[calc(100%+4rem)] lg:-mx-10 lg:w-[calc(100%+5rem)]", whyOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
          <div className="min-h-0 overflow-hidden">
            <BuildWhyPanel build={build} builds={builds} boot={selectedBoot} bootSlot={boot.slot} bootItems={bootItems} composition={composition} facts={facts} alternates={alternates} />
          </div>
        </div>
      </div>
    </section>
  );
}

function SkeletonLine({ className, children }: { className?: string; children: string }) {
  return (
    <p className={clsx("relative", className)}>
      <span className="text-transparent">{children}</span>
      <span className="absolute inset-x-[12%] top-1/2 h-[0.55em] -translate-y-1/2 animate-pulse rounded-full bg-[#F5E6D3]/[0.1]" />
    </p>
  );
}

function SkeletonItemRow({ count, size }: { count: number; size: "md" | "sm" }) {
  const tile = size === "sm" ? "h-[min(2.75rem,12vw)] w-[min(2.75rem,12vw)] sm:h-12 sm:w-12" : "h-[min(4rem,13vw)] w-[min(4rem,13vw)] sm:h-[4.5rem] sm:w-[4.5rem]";
  return (
    <div className="flex flex-nowrap justify-center gap-x-2 gap-y-4 sm:flex-wrap sm:gap-x-5">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex flex-col items-center gap-1.5">
          <span className="invisible text-[10px] font-medium tabular-nums">{index + 1}</span>
          <div className={clsx("animate-pulse rounded-xl bg-[#F5E6D3]/[0.08]", tile)} />
        </div>
      ))}
    </div>
  );
}

function BuildSkeleton() {
  return (
    <section className={clsx(GLASS_CLASS, "relative overflow-hidden px-0 py-6 max-sm:rounded-none max-sm:border-x-0 sm:p-8 lg:p-10")} aria-hidden>
      <div className="flex flex-col items-center text-center">
        <SkeletonLine className={LABEL_CLASS}>Recommended build</SkeletonLine>
        <SkeletonLine className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl lg:text-[2.1rem]">
          Titansbane
        </SkeletonLine>
        <SkeletonLine className="mt-1.5 text-sm sm:text-base">Maximum scaling DPS possible.</SkeletonLine>
        <div className="mt-7">
          <SkeletonItemRow count={6} size="md" />
        </div>

        <div className="mt-8 w-full border-t border-[#F5E6D3]/10 pt-7">
          <SkeletonLine className={LABEL_CLASS}>If you fall behind early</SkeletonLine>
          <SkeletonLine className="mt-1.5 text-lg font-bold tracking-tight">Inevitable Doom</SkeletonLine>
          <SkeletonLine className="mt-1 text-xs sm:text-sm">Midgame power, anti-tank.</SkeletonLine>
          <div className="mt-4">
            <SkeletonItemRow count={6} size="sm" />
          </div>
        </div>

        <SkeletonLine className="mt-8 text-sm font-semibold">Want to know why?</SkeletonLine>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Messages                                                            */
/* ------------------------------------------------------------------ */

function MessagePanel({
  title,
  body,
  tone = "neutral",
  action,
  id,
}: {
  title: string;
  body: string;
  tone?: "neutral" | "error";
  action?: ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={clsx(
        PANEL_CLASS,
        "p-5 sm:p-6",
        tone === "error" && "border-[#FF8FA3]/30 ring-[#FF8FA3]/15"
      )}
      role="status"
    >
      <h2
        className="text-lg font-bold tracking-tight"
        style={{ color: tone === "error" ? "#FFB3C1" : GUIDE.beige }}
      >
        {title}
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-[#F5E6D3]/65 sm:text-base">{body}</p>
      {action}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function BuildPickerClient({
  builds,
  bootItems,
  championRows,
  preview,
  guideTextIcons = {},
}: {
  builds: PickerBuild[];
  bootItems: PickerItem[];
  championRows: ChampionProfileRow[];
  preview?: LiveGameLookup;
  guideTextIcons?: Record<string, string>;
}) {
  const [mode, setMode] = useState<LookupMode>("live");
  const [riotId, setRiotId] = useState("");
  const [matchId, setMatchId] = useState("");
  const [platform, setPlatform] = useState<BuildPickerPlatformId>("auto");
  const [phase, setPhase] = useState<LookupPhase>("idle");
  const [lookupResult, setResult] = useState<LiveGameLookup | null>(null);
  const [possessionsPinned, setPossessionsPinned] = useState(false);
  const result = preview ?? lookupResult;
  const abortRef = useRef<AbortController | null>(null);
  const lastLookupRef = useRef<string>("");

  const selectPlatform = useCallback((next: BuildPickerPlatformId) => {
    setPlatform(next);
    try {
      localStorage.setItem(STORAGE_PLATFORM, next);
    } catch {
      // storage unavailable; ignore
    }
  }, []);

  const selectMode = useCallback((next: LookupMode) => {
    setMode(next);
    setResult(null);
    abortRef.current?.abort();
    setPhase("idle");
    lastLookupRef.current = "";
    try {
      localStorage.setItem(STORAGE_MODE, next);
    } catch {
      // storage unavailable; ignore
    }
  }, []);

  const lookup = useCallback(async (
    nextMode: LookupMode,
    rawId: string,
    platformId: BuildPickerPlatformId = "auto"
  ) => {
    const id = rawId.trim();
    const queryPlatform = nextMode === "match" ? matchLookupPlatform(platformId) : platformId;
    const resolvedMatchId = nextMode === "match" ? composeMatchId(id, queryPlatform) : null;
    if (nextMode === "live" && !RIOT_ID_RE.test(id)) return;
    if (nextMode === "match" && !resolvedMatchId) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    lastLookupRef.current = `${nextMode}:${queryPlatform}:${resolvedMatchId ?? id}`;

    setPhase("verifying");
    setPossessionsPinned(false);
    setResult(null);
    const phaseTimer = window.setTimeout(() => setPhase("searching"), 650);

    try {
      localStorage.setItem(STORAGE_PLATFORM, platformId);
      if (nextMode === "live") {
        localStorage.setItem(STORAGE_MODE, "live");
        localStorage.setItem(STORAGE_RIOT_ID, id);
      }
      localStorage.removeItem(STORAGE_MATCH_ID);
    } catch {
      // storage unavailable; ignore
    }

    try {
      const params = new URLSearchParams();
      if (nextMode === "match") {
        params.set("matchId", resolvedMatchId ?? id);
        params.set("platform", queryPlatform);
      } else {
        params.set("riotId", id);
        params.set("platform", platformId);
      }
      if (new URLSearchParams(window.location.search).get("mock") === "1") params.set("mock", "1");
      const response = await fetch(`/api/guide/live-game?${params.toString()}`, {
        signal: controller.signal,
      });
      const body = (await response.json()) as LiveGameLookup;
      if (controller.signal.aborted) return;
      setResult(body);
      if (response.ok && body.status === "in_game" && body.recommendation && !body.mock) {
        try {
          recordBuildLookup(localStorage);
          window.dispatchEvent(new Event(DONATION_LOOKUP_EVENT));
        } catch {
          // Local persistence must never interfere with displaying a build.
        }
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      setResult({
        status: "error",
        message: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      window.clearTimeout(phaseTimer);
      if (!controller.signal.aborted) setPhase("idle");
    }
  }, []);

  useEffect(() => {
    if (preview) return;
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("id")?.trim() ?? "";
    const matchFromUrl = params.get("match")?.trim() ?? "";
    let storedId = "";
    let storedPlatform: BuildPickerPlatformId = "auto";
    try {
      storedId = localStorage.getItem(STORAGE_RIOT_ID) ?? "";
      localStorage.removeItem(STORAGE_MATCH_ID);
      const savedPlatform = localStorage.getItem(STORAGE_PLATFORM);
      if (isPlatformId(savedPlatform)) storedPlatform = savedPlatform;
    } catch {
      // storage unavailable; ignore
    }
    setPlatform(storedPlatform);

    if (matchFromUrl) {
      const prefix = /^([A-Za-z0-9]+)_\d+$/.exec(matchFromUrl.trim())?.[1]?.toLowerCase();
      const fromPrefix = prefix && isPlatformId(prefix) && prefix !== "auto" ? prefix : null;
      const platformToUse = fromPrefix ?? storedPlatform;
      setMode("match");
      setMatchId(matchFromUrl);
      setPlatform(platformToUse);
      if (storedId) setRiotId(storedId);
      void lookup("match", matchFromUrl, platformToUse);
    } else if (fromUrl) {
      setMode("live");
      setRiotId(fromUrl);
      void lookup("live", fromUrl, storedPlatform);
    } else {
      setMode("live");
      if (storedId) setRiotId(storedId);
    }
  }, [lookup, preview]);

  useEffect(() => {
    if (preview || mode !== "live") return;
    const id = riotId.trim();
    if (!RIOT_ID_RE.test(id)) return;
    if (lastLookupRef.current === `live:${platform}:${id}`) return;
    const timer = window.setTimeout(() => void lookup("live", id, platform), AUTO_LOOKUP_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [riotId, platform, lookup, preview, mode]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const busy = phase !== "idle";
  const recommendation = result?.status === "in_game" ? result.recommendation : null;
  const recommendedBuild = recommendation
    ? builds.find((build) => build.id === recommendation.buildId)
    : undefined;
  const player = result?.status === "in_game"
    ? (result.playerSide === "blue" ? result.blue : result.red).find((participant) => participant.isSearchedPlayer)
    : undefined;

  return (
    <PickerTextIconsContext.Provider value={guideTextIcons}>
    <div className={clsx("possession-scope relative", !preview && "min-h-screen")} style={{ color: GUIDE.text }}>
      {!preview ? <DonationPrompt /> : null}
      <div className={clsx("relative z-10 mx-auto w-full max-w-5xl px-5 sm:px-8", preview ? "pb-6 pt-8" : "pb-24 pt-16 sm:pt-[4.8rem] lg:pt-[5.6rem]")}>
        {!preview && (
          <h1 className="mb-8 text-center text-2xl font-bold tracking-tight text-[#F5E6D3] sm:mb-10 sm:text-4xl lg:text-5xl">
            Build like Mino would.
          </h1>
        )}

        {!preview && <LookupForm
          mode={mode}
          riotId={riotId}
          matchId={matchId}
          platform={platform}
          busy={busy}
          cuePreviousGame={mode === "live" && result?.status === "not_in_game"}
          onModeChange={selectMode}
          onRiotIdChange={setRiotId}
          onMatchIdChange={setMatchId}
          onPlatformChange={selectPlatform}
          onSubmit={() => void lookup(mode, mode === "live" ? riotId : matchId, platform)}
        />}

        <div className={preview ? "" : "mt-12 sm:mt-16"}>
          {busy ? (
            <Stage
              busy
              caption={<PhaseCaption phase={phase} mode={mode} />}
              left={<TeamColumnSkeleton side="ally" />}
              center={<BuildSkeleton />}
              right={<TeamColumnSkeleton side="enemy" />}
            />
          ) : result?.status === "in_game" ? (
            <div key={`${result.source ?? "live"}-${result.matchId ?? result.riotId}-${result.gameStartedAt ?? 0}`}>
              <Stage
                mobileControls={result.recommendation ? (
                  <button
                    type="button"
                    aria-pressed={possessionsPinned}
                    onClick={() => setPossessionsPinned((pinned) => !pinned)}
                    className="possession-toggle inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#B8D8EA]/40 bg-[#111624]/95 px-4 py-2.5 text-xs font-semibold text-[#F5E6D3] transition hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F0ABCF] aria-pressed:bg-white/[0.08]"
                  >
                    <Eye aria-hidden className="h-3.5 w-3.5" />
                    Possessions
                  </button>
                ) : null}
                left={
                  <TeamColumn
                    title="Your team"
                    side="ally"
                    participants={result.playerSide === "blue" ? result.blue : result.red}
                    floatTags={result.recommendation?.floatTags.filter((entry) => entry.side === "ally")}
                    appearDelays={floatAppearDelays(result.recommendation?.floatTags ?? [])}
                    showScores={Boolean(preview)}
                  />
                }
                center={
                  result.recommendation ? (
                    <BuildCard
                      possessionsPinned={possessionsPinned}
                      onTogglePossessions={() => setPossessionsPinned((pinned) => !pinned)}
                      build={recommendedBuild}
                      buildId={result.recommendation.buildId}
                      builds={builds}
                      bootItems={bootItems}
                      boot={result.recommendation.boot}
                      recommendedAlternative={result.recommendation.alternative}
                      alternates={result.recommendation.alternates}
                      player={player}
                      source={result.source}
                      composition={result.recommendation.composition}
                      facts={result.recommendation.facts}
                    />
                  ) : null
                }
                right={
                  <TeamColumn
                    title="Enemy team"
                    side="enemy"
                    participants={result.playerSide === "blue" ? result.red : result.blue}
                    floatTags={result.recommendation?.floatTags.filter((entry) => entry.side === "enemy")}
                    appearDelays={floatAppearDelays(result.recommendation?.floatTags ?? [])}
                    showScores={Boolean(preview)}
                  />
                }
              />
            </div>
          ) : result?.status === "not_in_game" ? (
            <MessagePanel
              id="build-picker-not-in-game"
              title="You're currently not in-game"
              body="Do you want to check a previous game?"
              action={
                <button
                  type="button"
                  onClick={() => selectMode("match")}
                  className="mt-4 text-sm font-semibold text-[#FAD4E8] underline decoration-[#F0ABCF]/60 underline-offset-4 transition hover:text-[#F0ABCF]"
                >
                  Check a previous game
                </button>
              }
            />
          ) : result?.status === "not_found" ? (
            <MessagePanel
              title="Riot ID not found"
              body={`Couldn't find ${result.riotId}. Check the spelling and the tag after the #.`}
              tone="error"
            />
          ) : result?.status === "match_not_found" ? (
            <MessagePanel
              title="Match not found"
              body={`Couldn't find ${result.matchId}. Copy the full ID from your League match history, like EUW1_1234567890.`}
              tone="error"
            />
          ) : result?.status === "no_viego" ? (
            <MessagePanel
              title="No Viego in that game"
              body={`${result.matchId} didn't have a Viego. This picker is for jungle Viego lobbies.`}
            />
          ) : result?.status === "error" ? (
            <MessagePanel title="Something went wrong" body={result.message} tone="error" />
          ) : null}
        </div>

        {process.env.NODE_ENV === "development" && !preview ? (
          <>
            <section className="mt-24 sm:mt-32">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className={LABEL_CLASS}>Logic</p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-[#F5E6D3] sm:text-2xl">
                    How a build is picked
                  </h2>
                  <p className="mt-1 text-sm text-[#F5E6D3]/55">
                    {recommendation
                      ? "Highlighted row is what this game matched."
                      : "First matching line in each check wins. For you, not for viewers."}
                  </p>
                </div>
                <p className="text-xs text-[#F5E6D3]/45">{builds.filter((build) => build.id !== "sit-serpents").length} builds</p>
              </div>
              <PickerLogicView
                builds={builds}
                trace={recommendation?.trace}
                activeBuildId={recommendation?.buildId}
              />
            </section>

            <section className="mt-24 sm:mt-32">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className={LABEL_CLASS}>Logic</p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-[#F5E6D3] sm:text-2xl">
                    How boots are picked
                  </h2>
                  <p className="mt-1 text-sm text-[#F5E6D3]/55">
                    {recommendation
                      ? "Highlighted row is what this game matched."
                      : "First matching line wins. For you, not for viewers."}
                  </p>
                </div>
                <p className="text-xs text-[#F5E6D3]/45">4 boots</p>
              </div>
              <BootsLogicView
                bootItems={bootItems}
                trace={recommendation?.trace}
                activeBoot={recommendation?.boot}
              />
            </section>

            <section className="mt-24 sm:mt-32">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className={LABEL_CLASS}>Data</p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-[#F5E6D3] sm:text-2xl">
                    Champion traits
                  </h2>
                  <p className="mt-1 text-sm text-[#F5E6D3]/55">
                    Durability, shield, damage, CC, and Steelcaps ratings used by the live picker.
                  </p>
                </div>
                <p className="text-xs text-[#F5E6D3]/45">{championRows.length} champions</p>
              </div>
              <ChampionProfileTable rows={championRows} />
            </section>
          </>
        ) : null}
      </div>
    </div>
    </PickerTextIconsContext.Provider>
  );
}
