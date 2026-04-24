"use client";

import * as React from "react";
import SearchDropdown from "@/app/_components/small/SearchDropdown";
import StepContact from "@/app/checkout/_components/checkout-steps/StepContact";
import {
  FooterProvider,
  useFooter,
} from "@/app/checkout/_components/checkout-steps/FooterContext";
import PrimaryCTA from "@/app/_components/small/buttons/PrimaryCTA";
import GlassPanel from "@/app/_components/panels/GlassPanel";
import DividerWithLogo from "@/app/_components/small/Divider-logo";
import { X } from "lucide-react";
import { speedReviewRoleIconUrl } from "@/lib/speedReview/roleIcons";
import SpeedReviewsPriorityListener from "./SpeedReviewsPriorityListener";

const ROLES = ["TOP", "JUNGLE", "MID", "BOTTOM", "SUPPORT"] as const;

const SPEED_ROLE_ITEMS = ROLES.map((r) => ({
  value: r,
  label: r,
  icon: speedReviewRoleIconUrl(r),
}));

type QueueRow = {
  position: number;
  globalName: string;
  discordName: string;
  role: string;
  previousReviews: number;
};

type PublicPayload = {
  nextSessionAt: string | null;
  queue: QueueRow[];
};

function FooterBar() {
  const [footer] = useFooter();
  if (footer.hidden) return null;
  return (
    <div className="px-4 py-4 flex justify-end">
      <PrimaryCTA
        withHalo={false}
        className="h-10 px-6 text-base"
        disabled={!!footer.disabled || !!footer.loading}
        onClick={() => footer.onClick?.()}
      >
        {footer.label ?? "Continue"}
      </PrimaryCTA>
    </div>
  );
}

export default function SpeedReviewsClient() {
  const riotInputRef = React.useRef<HTMLInputElement | null>(null);
  const [riotTag, setRiotTag] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [discordIdentity, setDiscordIdentity] = React.useState<{
    id: string;
    globalName?: string | null;
    username?: string | null;
  } | null>(null);
  const [contactErr, setContactErr] = React.useState<string | null>(null);
  const [role, setRole] = React.useState<(typeof ROLES)[number]>(ROLES[0]);
  const [data, setData] = React.useState<PublicPayload | null>(null);
  const [loadErr, setLoadErr] = React.useState<string | null>(null);
  const [joining, setJoining] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalStep, setModalStep] = React.useState<1 | 2>(1);
  const [joinedSuccess, setJoinedSuccess] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoadErr(null);
    try {
      const res = await fetch("/api/speed-review", { cache: "no-store" });
      if (!res.ok) throw new Error("load_failed");
      const j = (await res.json()) as PublicPayload;
      setData(j);
    } catch {
      setLoadErr("Could not load queue.");
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const resetModal = React.useCallback(() => {
    setModalStep(1);
    setContactErr(null);
    setJoinedSuccess(false);
    setRiotTag("");
    setNotes("");
    setDiscordIdentity(null);
    setRole(ROLES[0]);
  }, []);

  const openModal = React.useCallback(() => {
    resetModal();
    setModalOpen(true);
  }, [resetModal]);

  const closeModal = React.useCallback(() => {
    setModalOpen(false);
    resetModal();
  }, [resetModal]);

  const goStep2 = React.useCallback(() => {
    if (!role) {
      setContactErr("Select your primary role.");
      return;
    }
    setContactErr(null);
    setModalStep(2);
  }, [role]);

  const submitJoin = React.useCallback(async () => {
    if (!discordIdentity?.id) return;
    if (!role) {
      setContactErr("Select your primary role.");
      return;
    }
    setContactErr(null);
    setJoining(true);
    try {
      const res = await fetch("/api/speed-review/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discordId: discordIdentity.id,
          globalName: discordIdentity.globalName ?? null,
          discordName: discordIdentity.username ?? null,
          riotTag: riotTag.trim(),
          role,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setContactErr(
          j.error === "riot_not_found"
            ? "Could not verify Riot ID."
            : j.error === "queue_identity_conflict"
              ? "Could not save your queue spot (identity conflict). Try again or contact support."
              : "Could not join queue. Try again."
        );
        return;
      }
      setJoinedSuccess(true);
      await load();
    } finally {
      setJoining(false);
    }
  }, [discordIdentity, riotTag, role, load]);

  const nextEventDate = data?.nextSessionAt ? new Date(data.nextSessionAt) : null;
  /** 24h HH:MM, local time, no timezone label */
  const nextEventTimeLine = nextEventDate
    ? nextEventDate.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : null;

  const initialLoadDone = data !== null || loadErr !== null;

  return (
    <>
      <SpeedReviewsPriorityListener onPrioritySuccess={load} />
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 pt-10 pb-36 text-white md:pt-14">
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-bold tracking-tight">Speed Reviews</h1>
          <p className="mt-2 text-white/70 text-xl max-w-xl mx-auto">
            Free coaching on Discord — sign up today
          </p>
        </div>

        {initialLoadDone ? (
          <div className="animate-speed-reviews-content-in">
      <GlassPanel className="mb-8 p-6 !backdrop-blur-none [backdrop-filter:none]">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:gap-0">
          <section className="min-w-0 flex-1 md:pr-6">
            <h2 className="sr-only">Next event</h2>
            {nextEventDate && nextEventTimeLine ? (
              <div
                className="rounded-2xl p-px bg-gradient-to-br from-[var(--color-orange)]/50 via-white/15 to-sky-500/30
                  shadow-[0_16px_48px_-20px_rgba(252,136,3,0.25)]"
              >
                <div className="flex items-stretch gap-4 sm:gap-5 rounded-[15px] bg-[#060a14]/95 px-4 py-4 sm:px-5 sm:py-5 ring-1 ring-white/[0.06]">
                  <div className="flex shrink-0 self-stretch justify-center">
                    <div
                      className="aspect-square h-full min-h-[5rem] max-h-[14rem] w-auto min-w-[5rem] rounded-xl
                        bg-gradient-to-b from-white/[0.1] to-white/[0.02] px-2 py-3 ring-1 ring-white/10
                        flex flex-col items-center justify-center gap-1"
                      aria-hidden
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/50">
                        {nextEventDate.toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="text-3xl sm:text-[2.35rem] font-semibold tabular-nums text-white leading-none tracking-tight">
                        {nextEventDate.getDate()}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col justify-center gap-3 border-l border-white/10 pl-4 sm:pl-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-orange)]">
                      Next event
                    </p>
                    <p className="inline-flex w-fit items-center rounded-lg bg-black/35 px-3 py-2 font-mono text-lg sm:text-xl tabular-nums text-white/90 ring-1 ring-white/10">
                      {nextEventTimeLine}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-white/60">No event currently scheduled. Check back soon.</p>
            )}
          </section>

          <div className="md:hidden">
            <DividerWithLogo className="py-1" />
          </div>

          <div className="hidden w-14 shrink-0 self-stretch md:flex md:justify-center">
            <DividerWithLogo vertical className="h-full max-w-[3.5rem]" />
          </div>

          <section className="min-w-0 flex-1 md:pl-2">
            <h2 className="text-lg font-semibold mb-3">How it works</h2>
            <ul className="text-sm text-white/75 space-y-2 list-disc pl-5">
              <li>Enter the queue below</li>
              <li>
                Join the{" "}
                <a
                  href="https://discord.gg/twrGXB7Px2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#7289DA] no-underline transition-colors hover:text-[#aab4ff]"
                >
                  stage channel
                </a>{" "}
                during the event and watch other players reviews
              </li>
              <li>When it&apos;s your turn, Sho will confirm you&apos;re around and review your game</li>
              <li>If you can&apos;t make it to an event, you won&apos;t be removed from the queue</li>
            </ul>
          </section>
        </div>
      </GlassPanel>

      <GlassPanel className="mb-8 p-6 !backdrop-blur-none [backdrop-filter:none]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold">Current queue</h2>
          <PrimaryCTA withHalo={false} className="h-10 px-6 shrink-0 w-full sm:w-auto" onClick={openModal}>
            Join the Queue
          </PrimaryCTA>
        </div>
        {loadErr && <p className="text-red-400 text-sm mb-2">{loadErr}</p>}
        {data ? (
          data.queue.length === 0 ? (
            <p className="text-white/60 text-sm">No one in the queue yet. Be the first.</p>
          ) : (
            <ul className="space-y-2">
              {data.queue.map((r) => (
                <li
                  key={`${r.position}-${r.globalName}-${r.discordName}-${r.role}`}
                  className="flex items-center justify-between gap-3 rounded-lg bg-white/[.04] px-3 py-2 text-sm"
                >
                  <span className="text-white/50 w-8">#{r.position}</span>
                  <span className="min-w-0 flex-1 font-medium truncate">
                    {r.globalName || r.discordName}
                  </span>
                  <span className="shrink-0 text-[11px] text-white/30">
                    Reviewed {r.previousReviews}x
                  </span>
                  <span className="flex w-10 shrink-0 items-center justify-end" title={r.role}>
                    <img
                      src={speedReviewRoleIconUrl(r.role)}
                      alt=""
                      className="h-7 w-7 object-contain"
                    />
                  </span>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </GlassPanel>
          </div>
        ) : null}

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/70"
          role="dialog"
          aria-modal="true"
          aria-labelledby="speed-review-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-visible rounded-2xl ring-1 ring-white/15 bg-[#0c1428]/95 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 overflow-visible">
              {modalStep === 2 && joinedSuccess ? (
                <div className="flex justify-end mb-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="shrink-0 rounded-lg p-2 -mr-1 -mt-1 text-white/70 hover:text-white hover:bg-white/10"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3 mb-6">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase tracking-wider text-white/45 mb-1">
                      Step {modalStep} of 2
                    </p>
                    <h2 id="speed-review-modal-title" className="text-xl font-semibold">
                      {modalStep === 1 && "Choose your role"}
                      {modalStep === 2 && "Riot ID & Discord"}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="shrink-0 rounded-lg p-2 -mr-1 -mt-1 text-white/70 hover:text-white hover:bg-white/10"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}

              {modalStep === 1 && (
                <div className="space-y-4">
                  <div className="w-full flex justify-center">
                    <SearchDropdown
                      items={SPEED_ROLE_ITEMS}
                      value={role}
                      onChange={setRole}
                      placeholder="Select your role"
                      searchable={false}
                      className="w-full max-w-full !z-[110]"
                      itemClassName="h-11 px-3 text-sm"
                    />
                  </div>
                  {contactErr && modalStep === 1 && (
                    <p className="text-sm text-red-400">{contactErr}</p>
                  )}
                  <div className="flex justify-end pt-2">
                    <PrimaryCTA withHalo={false} className="h-10 px-6" onClick={goStep2}>
                      Continue
                    </PrimaryCTA>
                  </div>
                </div>
              )}

              {modalStep === 2 && !joinedSuccess && (
                <div className="space-y-4">
                  <FooterProvider>
                    <StepContact
                      riotTag={riotTag}
                      notes={notes}
                      setRiotTag={setRiotTag}
                      setNotes={setNotes}
                      onDiscordLinked={setDiscordIdentity}
                      discordIdentity={discordIdentity}
                      contactErr={contactErr}
                      riotInputRef={riotInputRef}
                      onSubmit={submitJoin}
                      hideNotes
                      hideContactHeading
                      footerLabel={joining ? "Joining…" : "Join the queue"}
                      footerLoading={joining}
                    />
                    <FooterBar />
                  </FooterProvider>
                </div>
              )}

              {modalStep === 2 && joinedSuccess && (
                <div className="flex flex-col items-center justify-center text-center text-white">
                  <h2 id="speed-review-modal-title" className="text-2xl font-semibold mb-2">
                    You&apos;re in the queue 🎉
                  </h2>
                  <p className="text-white/70 max-w-sm mb-6">
                    See you soon! 
                  </p>
                  <PrimaryCTA withHalo={false} className="h-10 px-8" onClick={closeModal}>
                    Done
                  </PrimaryCTA>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
