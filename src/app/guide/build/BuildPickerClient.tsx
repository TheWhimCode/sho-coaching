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
import type {
  ChampionProfileRow,
  LiveGameLookup,
  LiveGameParticipant,
} from "@/lib/guides/buildPicker/types";
import type { PickerBuild } from "@/lib/guides/buildPicker/builds";
import { guideChampionIconImgClass, GUIDE } from "@/lib/guides/guideTheme";
import ChampionProfileTable from "./ChampionProfileTable";
import PickerLogicView from "./PickerLogicView";

/** Recommended build → cheaper pivot if you fall behind early. */
const FALL_BEHIND_ALTERNATIVES: Record<string, string> = {
  "hubris-ldr": "hubris-skip-anti-tank",
  "main-hubris": "umbral-collector",
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

function TeamColumn({
  title,
  side,
  participants,
}: {
  title: string;
  side: "ally" | "enemy";
  participants: LiveGameParticipant[];
}) {
  const accent = side === "ally" ? GUIDE.lightBlue : GUIDE.pink;
  const enemy = side === "enemy";
  return (
    <div className={clsx("flex flex-col", enemy ? "items-end" : "items-start")}>
      <p className={LABEL_CLASS} style={{ color: accent }}>
        {title}
      </p>
      <ul className="mt-4 flex flex-col gap-3 sm:gap-3.5">
        {participants.map((participant) => (
          <li
            key={`${participant.championId}-${participant.isSearchedPlayer}`}
            className={clsx("flex items-center gap-2", enemy && "flex-row-reverse")}
            title={
              participant.isSearchedPlayer && participant.riotId
                ? `${participant.championName} · ${participant.riotId}`
                : participant.championName
            }
          >
            <div
              className={clsx(
                "relative shrink-0 overflow-hidden rounded-xl ring-1 transition",
                PORTRAIT_CLASS,
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
                className={guideChampionIconImgClass}
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
                    <GuideImage src={spellEntry.icon} alt={spellEntry.key} className="h-full w-full object-cover" />
                  ) : null}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TeamColumnSkeleton({ side }: { side: "ally" | "enemy" }) {
  const enemy = side === "enemy";
  return (
    <div className={clsx("flex flex-col", enemy ? "items-end" : "items-start")} aria-hidden>
      <div
        className={clsx(
          "h-2.5 w-20 rounded-full",
          enemy ? "bg-[#F0ABCF]/25" : "bg-[#B8D8EA]/25"
        )}
      />
      <ul className="mt-4 flex flex-col gap-3 sm:gap-3.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <li key={index} className={clsx("flex items-center gap-2", enemy && "flex-row-reverse")}>
            <div
              className={clsx("shrink-0 animate-pulse rounded-xl bg-[#F5E6D3]/[0.08]", PORTRAIT_CLASS)}
              style={{ animationDelay: `${index * 90}ms` }}
            />
            <div className="flex shrink-0 flex-col gap-1">
              <div className={clsx("animate-pulse rounded-md bg-[#F5E6D3]/[0.07]", SPELL_CLASS)} />
              <div className={clsx("animate-pulse rounded-md bg-[#F5E6D3]/[0.07]", SPELL_CLASS)} />
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
    <section className="lg:-mx-12 xl:-mx-20" aria-busy={busy || undefined}>
      {caption ? <div className="mb-6 flex justify-center">{caption}</div> : null}
      <div className="grid grid-cols-2 items-start gap-x-6 gap-y-8 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-x-8 lg:gap-x-14">
        <div className="order-1">{left}</div>
        <div className="order-3 col-span-2 sm:order-2 sm:col-span-1">{center}</div>
        <div className="order-2 sm:order-3">{right}</div>
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

function ItemOrder({
  build,
  size = "md",
}: {
  build: PickerBuild;
  size?: "md" | "sm";
}) {
  const tile = size === "sm" ? "h-11 w-11 sm:h-12 sm:w-12" : "h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]";
  return (
    <ol aria-label={`${build.label} item order`} className="flex flex-wrap justify-center gap-x-3 gap-y-4 sm:gap-x-5">
      {build.items.map((item, index) => (
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
}: {
  build: PickerBuild | undefined;
  buildId: string;
  builds: PickerBuild[];
}) {
  const fallBehindId = FALL_BEHIND_ALTERNATIVES[buildId];
  const fallBehind = fallBehindId ? builds.find((entry) => entry.id === fallBehindId) : undefined;

  return (
    <section className={clsx(GLASS_CLASS, "relative overflow-hidden p-6 sm:p-8 lg:p-10")}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 0%, rgba(240, 171, 207, 0.16), transparent 65%), radial-gradient(ellipse 60% 50% at 50% 100%, rgba(184, 216, 234, 0.08), transparent 70%)",
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
              <ItemOrder build={build} />
            </div>
          </>
        ) : (
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#FAD4E8]">
            Unknown build &ldquo;{buildId}&rdquo;
          </h2>
        )}

        {fallBehind ? (
          <div className="mt-8 w-full border-t border-[#F5E6D3]/10 pt-7">
            <p className={LABEL_CLASS}>If you fall behind early</p>
            <p className="mt-1.5 text-lg font-bold tracking-tight text-[#F5E6D3]/85">{fallBehind.label}</p>
            {fallBehind.summary ? (
              <p className="mt-1 text-xs text-[#F5E6D3]/50 sm:text-sm">{fallBehind.summary}</p>
            ) : null}
            <div className="mt-4">
              <ItemOrder build={fallBehind} size="sm" />
            </div>
          </div>
        ) : null}

        <button
          type="button"
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#B8D8EA] transition hover:text-[#FAD4E8]"
        >
          Want to know why?
        </button>
      </div>
    </section>
  );
}

function BuildSkeleton() {
  return (
    <section className={clsx(GLASS_CLASS, "p-6 sm:p-8 lg:p-10")} aria-hidden>
      <div className="flex flex-col items-center">
        <div className="h-2.5 w-32 rounded-full bg-[#B8D8EA]/20" />
        <div className="mt-3.5 h-7 w-52 animate-pulse rounded-full bg-[#F5E6D3]/[0.1]" />
        <div className="mt-2.5 h-3.5 w-64 max-w-full animate-pulse rounded-full bg-[#F5E6D3]/[0.07]" />
        <div className="mt-7 flex flex-wrap justify-center gap-x-3 gap-y-5 sm:gap-x-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex flex-col items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#B8D8EA]/20" />
              <div className="h-16 w-16 animate-pulse rounded-xl bg-[#F5E6D3]/[0.08] sm:h-[4.5rem] sm:w-[4.5rem]" />
              <div className="h-2 w-12 animate-pulse rounded-full bg-[#F5E6D3]/[0.06]" />
            </div>
          ))}
        </div>
        <div className="mt-8 h-4 w-36 animate-pulse rounded-full bg-[#B8D8EA]/15" />
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
  championRows,
}: {
  builds: PickerBuild[];
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
      <div className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-24 pt-20 sm:px-8 sm:pt-24 lg:pt-28">
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
            <div key={`${result.riotId}-${result.gameStartedAt ?? 0}`} className="animate-item-tip-in-below">
              <Stage
                left={
                  <TeamColumn
                    title="Your team"
                    side="ally"
                    participants={result.playerSide === "blue" ? result.blue : result.red}
                  />
                }
                center={
                  result.recommendation ? (
                    <BuildCard
                      build={recommendedBuild}
                      buildId={result.recommendation.buildId}
                      builds={builds}
                    />
                  ) : null
                }
                right={
                  <TeamColumn
                    title="Enemy team"
                    side="enemy"
                    participants={result.playerSide === "blue" ? result.red : result.blue}
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
      </div>
    </div>
  );
}
