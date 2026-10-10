"use client";

import clsx from "clsx";
import { ArrowRight, Search } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import GuideImage from "@/app/_components/guides/GuideImage";
import type { BuildFloatTag } from "@/lib/guides/buildPicker/decisionTree";
import type {
  ChampionProfileRow,
  LiveGameLookup,
  LiveGameParticipant,
} from "@/lib/guides/buildPicker/types";
import type { PickerBuild, PickerItem } from "@/lib/guides/buildPicker/builds";
import { guideChampionIconImgClass, GUIDE } from "@/lib/guides/guideTheme";
import BootsLogicView from "./BootsLogicView";
import ChampionProfileTable from "./ChampionProfileTable";
import PickerLogicView from "./PickerLogicView";

/** Recommended build → useful pivot when the reason you picked it stops being true. */
const BUILD_ALTERNATIVES: Record<string, { buildId: string; label: string }> = {
  "hubris-ldr": { buildId: "hubris-skip-anti-tank", label: "If you fall behind early" },
  "main-hubris": { buildId: "umbral-collector", label: "If you fall behind early" },
  "main-bastionbreaker": { buildId: "umbral-collector", label: "If your gold lines up better" },
  "yun-tal-ldr": { buildId: "hubris-ldr", label: "If you miss B. F. Sword on first reset" },
  "bastionbreaker-cyclosword": { buildId: "main-bastionbreaker", label: "If enemies end up stacking armor" },
  "collector-shieldbow": { buildId: "umbral-collector", label: "If you fall too far behind" },
  "sit-serpents-first": { buildId: "sit-serpents", label: "If you want anti-shield later" },
  "sit-serpents": { buildId: "sit-serpents-late", label: "If you want anti-shield later" },
  "sit-serpents-late": { buildId: "sit-serpents", label: "If you want anti-shield earlier" },
};

const STORAGE_RIOT_ID = "viego-build-picker-riot-id";

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

type BuildTraceStep = {
  nodeId: string;
  optionId: string;
  detail: string;
};

function nearbyBuildRoutes(trace: BuildTraceStep[]) {
  const routes: { buildId: string; reason: string; detail: string }[] = [];
  const tanky = trace.find((step) => step.nodeId === "tanky");
  const shields = trace.find((step) => step.nodeId === "shields");

  if (tanky?.optionId === "hubris") {
    routes.push({ buildId: "main-bastionbreaker", reason: "One more bruiser would have moved you into Bread & Butter Carnage.", detail: tanky.detail });
  } else if (tanky?.optionId === "two-bruisers") {
    routes.push({ buildId: "main-hubris", reason: "One fewer bruiser would have kept the standard Hubris route.", detail: tanky.detail });
  } else if (tanky?.optionId === "tanks") {
    routes.push({ buildId: "main-bastionbreaker", reason: "One fewer frontline target would have kept this on Bread & Butter Carnage.", detail: tanky.detail });
  } else if (tanky?.optionId === "all-squishy") {
    routes.push({ buildId: "main-bastionbreaker", reason: "One more durable target would have ended the full-Lethality route.", detail: tanky.detail });
  }

  if (shields?.optionId === "none") {
    const early = Number(/(\d+) early small/.exec(shields.detail)?.[1] ?? 0);
    const late = Number(/(\d+) late small/.exec(shields.detail)?.[1] ?? 0);
    const needed = Math.max(1, 5 - early - late);
    routes.push({
      buildId: "sit-serpents",
      reason: needed === 1 ? "One more smaller shield source would have made Serpent's Fang worth it." : `${needed} more smaller shield sources would make Serpent's Fang worth it.`,
      detail: shields.detail,
    });
  }

  return routes;
}

function decidingTags(trace: BuildTraceStep[]) {
  const tags: string[] = [];
  const tanky = trace.find((step) => step.nodeId === "tanky");
  const lowDamage = trace.find((step) => step.nodeId === "low-damage-dps" && step.optionId === "yes");
  const shields = trace.find((step) => step.nodeId === "shields" && step.optionId !== "none");
  const survivability = trace.find((step) => step.nodeId === "survivability" && step.optionId === "yes");
  const resetDeniers = trace.find((step) => step.nodeId === "reset-deniers");

  if (tanky) {
    const [, displayedSquishy = "0", displayedBruiser = "0", tank = "0"] = /(\d+) squishy, (\d+) bruiser, (\d+) tanky/.exec(tanky.detail) ?? [];
    const olderAdjustedTrace = /ally \d+ AD → \+1 bruiser/.test(tanky.detail);
    const squishy = String(Number(displayedSquishy) + (olderAdjustedTrace ? 1 : 0));
    const bruiser = String(Math.max(0, Number(displayedBruiser) - (olderAdjustedTrace ? 1 : 0)));
    if (Number(squishy) > 0) tags.push(`${squishy} squish${squishy === "1" ? "y" : "ies"}`);
    if (Number(bruiser) > 0) tags.push(`${bruiser} bruiser${bruiser === "1" ? "" : "s"}`);
    if (Number(tank) > 0) tags.push(`${tank} tank${tank === "1" ? "" : "s"}`);
    if (olderAdjustedTrace || tanky.detail.includes("3+ AD allies")) tags.push("3+ AD allies");
  }

  if (lowDamage) {
    const [, enemies = "0", allies = "0"] = /(\d+) enemy Low damage, (\d+) ally Low damage/.exec(lowDamage.detail) ?? [];
    tags.push(`${enemies} low-damage enemies`, `${allies} low-damage allies`);
  }

  if (shields) tags.push("Enough shields");

  if (survivability) {
    const [, enemyAd = "0", enemyAp = "0", highCc = "0"] = /, (\d+) enemy AD, (\d+) enemy AP, (\d+) enemy High CC/.exec(survivability.detail) ?? [];
    if (Number(enemyAd) >= 3) tags.push(`${enemyAd} enemy AD`);
    if (Number(enemyAp) >= 4) tags.push(`${enemyAp} enemy AP`);
    if (Number(highCc) >= 3) tags.push(`${highCc} High CC`);
  }

  if (resetDeniers) tags.push(resetDeniers.detail);
  return tags.slice(0, 6);
}

function BuildWhyPanel({
  trace,
  builds,
  boot,
  bootSlot,
}: {
  trace: BuildTraceStep[];
  builds: PickerBuild[];
  boot?: PickerItem;
  bootSlot: 2 | 3 | 4;
}) {
  const routes = nearbyBuildRoutes(trace).flatMap((route) => {
    const build = builds.find((entry) => entry.id === route.buildId);
    return build ? [{ ...route, build }] : [];
  }).slice(0, 3);
  const tags = decidingTags(trace);

  return (
    <div className="mt-7 border-t border-[#B8D8EA]/18 bg-[#120F19]/95 px-6 pb-9 pt-7 text-left sm:px-10 sm:pb-12 sm:pt-9">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-2 text-[0.58rem] font-bold uppercase tracking-[0.15em] text-[#B8D8EA]/68">What decided it</p>
        {tags.map((tag) => (
          <span key={tag} className="rounded-full border border-[#F0ABCF]/22 bg-[#F0ABCF]/[0.07] px-2.5 py-1 text-[0.62rem] font-semibold text-[#F5E6D3]/72">
            {tag}
          </span>
        ))}
      </div>

      <div className="my-7 h-px w-full bg-gradient-to-r from-transparent via-[#F0ABCF]/30 to-transparent" />
      <p className="text-[0.58rem] font-bold uppercase tracking-[0.15em] text-[#F5E6D3]/48">Alternative builds</p>
      {routes.length ? (
        <div className="mt-3 divide-y divide-[#F5E6D3]/10">
          {routes.map((route) => (
            <div key={route.build.id} className="grid gap-6 py-7 opacity-50 grayscale transition duration-300 hover:opacity-80 hover:grayscale-0 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:items-center sm:gap-8">
              <div>
                <p className="text-base font-bold tracking-tight text-[#F5E6D3]">{route.build.label}</p>
                <p className="mt-3 text-xs font-medium leading-relaxed text-[#FFB3C1]">{route.reason}</p>
              </div>
              <div className="min-w-0">
                <ItemOrder build={route.build} boot={boot} bootSlot={bootSlot} size="sm" noWrap />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-[#F5E6D3]/45">No nearby route was ruled out in this game.</p>
      )}
    </div>
  );
}

type LookupPhase = "idle" | "verifying" | "searching";

function LookupForm({
  riotId,
  busy,
  onRiotIdChange,
  onSubmit,
}: {
  riotId: string;
  busy: boolean;
  onRiotIdChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const valid = RIOT_ID_RE.test(riotId.trim());

  return (
    <form
      className={clsx(GLASS_CLASS, "flex flex-col gap-2 p-2 sm:flex-row sm:items-center sm:gap-2 sm:p-2")}
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="relative flex min-w-0 flex-1 items-center">
        <Search className="pointer-events-none absolute left-4 h-4 w-4 text-[#F5E6D3]/35" aria-hidden />
        <input
          id="build-picker-riot-id"
          aria-label="Riot ID"
          value={riotId}
          onChange={(event) => onRiotIdChange(event.target.value)}
          placeholder="Riot#TAG"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          inputMode="text"
          className="h-12 w-full bg-transparent pl-11 pr-4 text-base text-[#F5EDE6] outline-none placeholder:text-[#F5E6D3]/35"
        />
      </div>
      <button
        type="submit"
        disabled={!valid || busy}
        className={clsx(
          "inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition",
          "bg-[#F0ABCF] text-[#2A1F2E] hover:bg-[#FAD4E8]",
          "disabled:cursor-not-allowed disabled:bg-[#F0ABCF]/25 disabled:text-[#F5E6D3]/45"
        )}
      >
        Find my game
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </form>
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
  shield: "#F3F1EE",
  barrier: "#C9A0E8",
  damage: "#3EBEA4",
  tank: "#B7B4B1",
  bruiser: "#D67A38",
  squishy: "#6EB6F2",
  survive: "#F078A4",
  ad: "#C84A32",
  ap: "#A56EE0",
  cc: "#E4587C",
  disengage: "#E8B040",
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

/** Disc around a point slightly above the portrait center. Rolled once per result. */
const FLOAT_SPAWN_RADIUS_PX = 42;

function rollAroundCenter() {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.sqrt(Math.random()) * FLOAT_SPAWN_RADIUS_PX;
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
  const [positions] = useState(() => {
    const rolled: Record<string, { x: number; y: number }> = {};
    for (const tag of tags) rolled[floatTagKey(tag)] = rollAroundCenter();
    return rolled;
  });
  if (tags.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20" aria-hidden>
      {tags.map((entry) => {
        const spot = positions[floatTagKey(entry)] ?? { x: 0, y: 0 };
        return (
          <span
            key={floatTagKey(entry)}
            className="absolute left-1/2 top-[40%] whitespace-nowrap"
            style={{ transform: `translate(calc(-50% + ${spot.x}px), calc(-50% + ${spot.y}px))` }}
          >
            <span
              className="build-float-tag inline-block text-[0.86rem] font-extrabold uppercase leading-none tracking-[0.06em]"
              style={{
                color: FLOAT_COLOR[entry.tone],
                fontSize: "0.86rem",
                textShadow: "0 0 1px rgba(8,6,12,1), 0 0 5px rgba(8,6,12,0.95), 0 0 12px rgba(8,6,12,0.75)",
                animationDelay: `${appearDelays[floatTagKey(entry)] ?? FLOAT_TAG_START_MS}ms`,
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

function TeamColumn({
  title,
  side,
  participants,
  floatTags = [],
  appearDelays = {},
}: {
  title: string;
  side: "ally" | "enemy";
  participants: LiveGameParticipant[];
  floatTags?: BuildFloatTag[];
  appearDelays?: Record<string, number>;
}) {
  const accent = side === "ally" ? GUIDE.lightBlue : GUIDE.pink;
  const enemy = side === "enemy";
  return (
    <div className={clsx("flex flex-col", enemy ? "items-end" : "items-start")}>
      <p className={LABEL_CLASS} style={{ color: accent }}>
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
      <p className={clsx(LABEL_CLASS, "relative")}>
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
}: {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  caption?: ReactNode;
  busy?: boolean;
}) {
  return (
    <section className="relative lg:-mx-12 xl:-mx-20" aria-busy={busy || undefined}>
      {caption ? <div className="pointer-events-none absolute bottom-full left-0 right-0 mb-3 flex justify-center">{caption}</div> : null}
      <div className="grid grid-cols-2 items-start gap-x-6 gap-y-8 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-x-8 lg:gap-x-14">
        <div className="order-1 sm:pt-10">{left}</div>
        <div className="order-3 col-span-2 sm:order-2 sm:col-span-1">{center}</div>
        <div className="order-2 sm:order-3 sm:pt-10">{right}</div>
      </div>
    </section>
  );
}

function PhaseCaption({ phase }: { phase: LookupPhase }) {
  return (
    <p className="flex items-center gap-2 text-xs text-[#F5E6D3]/60" role="status">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F0ABCF]/60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F0ABCF]" />
      </span>
      {phase === "verifying" ? "Verifying Riot ID…" : "Looking for your game…"}
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
}: {
  build: PickerBuild;
  boot?: PickerItem;
  bootSlot?: 2 | 3 | 4;
  size?: "md" | "sm";
  noWrap?: boolean;
}) {
  const tile = size === "sm" ? "h-11 w-11 sm:h-12 sm:w-12" : "h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]";
  const items = [...build.items];
  if (boot && bootSlot) items.splice(bootSlot - 1, 0, boot);
  return (
    <ol aria-label={`${build.label} item order`} className={clsx("flex justify-center gap-x-3 gap-y-4 sm:gap-x-5", noWrap ? "flex-nowrap" : "flex-wrap")}>
      {items.map((item, index) => (
        <li key={`${index}-${item.id}`} className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] font-medium tabular-nums text-[#B8D8EA]/65">{index + 1}</span>
          <div
            className={clsx(
              "overflow-hidden rounded-xl bg-[#352839] ring-1 ring-[#F0ABCF]/40",
              size === "md" && "shadow-[0_0_22px_rgba(240,171,207,0.22),0_10px_30px_rgba(0,0,0,0.45)]",
              tile
            )}
            title={item.name}
          >
            <GuideImage src={item.icon} alt={item.name} className="h-full w-full object-cover" />
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
  trace,
}: {
  build: PickerBuild | undefined;
  buildId: string;
  builds: PickerBuild[];
  bootItems: PickerItem[];
  boot: { itemId: number; slot: 2 | 3 | 4 };
  recommendedAlternative?: { buildId: string; label: string };
  trace: BuildTraceStep[];
}) {
  const alternative = recommendedAlternative ?? BUILD_ALTERNATIVES[buildId];
  const alternativeBuild = alternative
    ? builds.find((entry) => entry.id === alternative.buildId)
    : undefined;
  const selectedBoot = bootItems.find((item) => item.id === boot.itemId);
  const [whyOpen, setWhyOpen] = useState(false);

  return (
    <section
      className={clsx(GLASS_CLASS, "relative overflow-hidden p-6 sm:p-8 lg:p-10")}
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
        <p className={LABEL_CLASS}>Recommended build</p>
        {build ? (
          <>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#FAD4E8] sm:text-3xl lg:text-[2.1rem]">
              {build.label}
            </h2>
            {build.summary ? (
              <p className="mt-1.5 text-sm text-[#F5E6D3]/60 sm:text-base">{build.summary}</p>
            ) : null}
            <div className="mt-7">
              <ItemOrder build={build} boot={selectedBoot} bootSlot={boot.slot} />
            </div>
          </>
        ) : (
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#FAD4E8]">
            Unknown build &ldquo;{buildId}&rdquo;
          </h2>
        )}

        {alternativeBuild && alternative ? (
          <div className="mt-8 w-full border-t border-[#F5E6D3]/10 pt-7">
            <p className={LABEL_CLASS}>{alternative.label}</p>
            <p className="mt-1.5 text-lg font-bold tracking-tight text-[#F5E6D3]/85">{alternativeBuild.label}</p>
            {alternativeBuild.summary && !isItemListSummary(alternativeBuild.summary) ? (
              <p className="mt-1 text-xs text-[#F5E6D3]/50 sm:text-sm">{alternativeBuild.summary}</p>
            ) : null}
            <div className="mt-4">
              <ItemOrder build={alternativeBuild} boot={selectedBoot} bootSlot={boot.slot} size="sm" />
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setWhyOpen((open) => !open)}
          aria-expanded={whyOpen}
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#B8D8EA] transition hover:text-[#FAD4E8]"
        >
          {whyOpen ? "Hide breakdown" : "Want to know why?"}
        </button>
        <div className={clsx("-mx-6 grid w-[calc(100%+3rem)] transition-[grid-template-rows,opacity] duration-500 ease-out sm:-mx-8 sm:w-[calc(100%+4rem)] lg:-mx-10 lg:w-[calc(100%+5rem)]", whyOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
          <div className="min-h-0 overflow-hidden">
            <BuildWhyPanel trace={trace} builds={builds} boot={selectedBoot} bootSlot={boot.slot} />
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
  const tile = size === "sm" ? "h-11 w-11 sm:h-12 sm:w-12" : "h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]";
  return (
    <div className="flex flex-wrap justify-center gap-x-3 gap-y-4 sm:gap-x-5">
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
    <section className={clsx(GLASS_CLASS, "relative overflow-hidden p-6 sm:p-8 lg:p-10")} aria-hidden>
      <div className="flex flex-col items-center text-center">
        <SkeletonLine className={LABEL_CLASS}>Recommended build</SkeletonLine>
        <SkeletonLine className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl lg:text-[2.1rem]">
          Full scaling anti-tank
        </SkeletonLine>
        <SkeletonLine className="mt-1.5 text-sm sm:text-base">Maximum scaling DPS possible.</SkeletonLine>
        <div className="mt-7">
          <SkeletonItemRow count={6} size="md" />
        </div>

        <div className="mt-8 w-full border-t border-[#F5E6D3]/10 pt-7">
          <SkeletonLine className={LABEL_CLASS}>If you fall behind early</SkeletonLine>
          <SkeletonLine className="mt-1.5 text-lg font-bold tracking-tight">Hubris skip anti-tank</SkeletonLine>
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
}: {
  title: string;
  body: string;
  tone?: "neutral" | "error";
}) {
  return (
    <section
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
}: {
  builds: PickerBuild[];
  bootItems: PickerItem[];
  championRows: ChampionProfileRow[];
}) {
  const [riotId, setRiotId] = useState("");
  const [phase, setPhase] = useState<LookupPhase>("idle");
  const [result, setResult] = useState<LiveGameLookup | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastLookupRef = useRef<string>("");

  const lookup = useCallback(async (rawId: string) => {
    const id = rawId.trim();
    if (!RIOT_ID_RE.test(id)) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    lastLookupRef.current = id;

    setPhase("verifying");
    setResult(null);
    const phaseTimer = window.setTimeout(() => setPhase("searching"), 650);

    try {
      localStorage.setItem(STORAGE_RIOT_ID, id);
    } catch {
      // storage unavailable; ignore
    }

    try {
      const params = new URLSearchParams({ riotId: id, platform: "auto" });
      if (new URLSearchParams(window.location.search).get("mock") === "1") params.set("mock", "1");
      const response = await fetch(`/api/guide/live-game?${params.toString()}`, {
        signal: controller.signal,
      });
      const body = (await response.json()) as LiveGameLookup;
      if (controller.signal.aborted) return;
      setResult(body);
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
    const fromUrl = new URLSearchParams(window.location.search).get("id")?.trim() ?? "";
    let storedId = "";
    try {
      storedId = localStorage.getItem(STORAGE_RIOT_ID) ?? "";
    } catch {
      // storage unavailable; ignore
    }

    if (fromUrl) {
      setRiotId(fromUrl);
      void lookup(fromUrl);
    } else if (storedId) {
      setRiotId(storedId);
    }
  }, [lookup]);

  useEffect(() => {
    const id = riotId.trim();
    if (!RIOT_ID_RE.test(id)) return;
    if (lastLookupRef.current === id) return;
    const timer = window.setTimeout(() => void lookup(id), AUTO_LOOKUP_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [riotId, lookup]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const busy = phase !== "idle";
  const recommendation = result?.status === "in_game" ? result.recommendation : null;
  const recommendedBuild = recommendation
    ? builds.find((build) => build.id === recommendation.buildId)
    : undefined;

  return (
    <div className="relative min-h-screen" style={{ color: GUIDE.text }}>
      <div className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-24 pt-16 sm:px-8 sm:pt-[4.8rem] lg:pt-[5.6rem]">
        <h1 className="mb-8 text-center text-3xl font-bold tracking-tight text-[#F5E6D3] sm:mb-10 sm:text-4xl lg:text-5xl">
          Build like Mino would.
        </h1>

        <LookupForm riotId={riotId} busy={busy} onRiotIdChange={setRiotId} onSubmit={() => void lookup(riotId)} />

        <div className="mt-12 sm:mt-16">
          {busy ? (
            <Stage
              busy
              caption={<PhaseCaption phase={phase} />}
              left={<TeamColumnSkeleton side="ally" />}
              center={<BuildSkeleton />}
              right={<TeamColumnSkeleton side="enemy" />}
            />
          ) : result?.status === "in_game" ? (
            <div key={`${result.riotId}-${result.gameStartedAt ?? 0}`}>
              <Stage
                left={
                  <TeamColumn
                    title="Your team"
                    side="ally"
                    participants={result.playerSide === "blue" ? result.blue : result.red}
                    floatTags={result.recommendation?.floatTags.filter((entry) => entry.side === "ally")}
                    appearDelays={floatAppearDelays(result.recommendation?.floatTags ?? [])}
                  />
                }
                center={
                  result.recommendation ? (
                    <BuildCard
                      build={recommendedBuild}
                      buildId={result.recommendation.buildId}
                      builds={builds}
                      bootItems={bootItems}
                      boot={result.recommendation.boot}
                      recommendedAlternative={result.recommendation.alternative}
                      trace={result.recommendation.trace}
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
                  />
                }
              />
            </div>
          ) : result?.status === "not_in_game" ? (
            <MessagePanel
              title="Not in a game right now"
              body={`${result.riotId} isn't in a live game. Try again once you're past champion select.`}
            />
          ) : result?.status === "not_found" ? (
            <MessagePanel
              title="Riot ID not found"
              body={`Couldn't find ${result.riotId}. Check the spelling and the tag after the #.`}
              tone="error"
            />
          ) : result?.status === "error" ? (
            <MessagePanel title="Something went wrong" body={result.message} tone="error" />
          ) : null}
        </div>

        {process.env.NODE_ENV === "development" ? (
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
                <p className="text-xs text-[#F5E6D3]/45">{builds.length} builds</p>
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
                    The per-champion stats the picker uses to choose a build.
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
  );
}
