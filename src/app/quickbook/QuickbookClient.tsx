// src/app/quickbook/QuickbookClient.tsx
"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

import QuickbookShell from "./_components/QuickbookShell";
import StepQuickContact from "./_components/StepQuickContact";
import StepQuickCalendar from "./_components/StepQuickCalendar";
import StepQuickSuccess from "./_components/StepQuickSuccess";

import type { DiscordIdentity, QuickbookConfig, RiotVerified } from "./_components/types";
import { fetchSlots } from "@/utils/api";
import type { Slot } from "@/utils/api";

import PrimaryCTA from "@/app/_components/small/buttons/PrimaryCTA";
import OutlineCTA from "@/app/_components/small/buttons/OutlineCTA";

type Props = {
  sessionType: string;
  liveMinutes?: number;
  followups?: number;
  liveBlocks?: number;
  productId?: QuickbookConfig["productId"];
};

type FooterState = {
  primaryLabel: string;
  primaryDisabled: boolean;
  onPrimary: () => void;
  secondaryLabel?: string;
  secondaryDisabled?: boolean;
  onSecondary?: () => void;
};

export default function QuickbookClient({
  sessionType,
  liveMinutes = 60,
  followups = 0,
  liveBlocks = 0,
  productId,
}: Props) {
  const [step, setStep] = React.useState<0 | 1 | 2>(0);

  const [riotTag, setRiotTag] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [discordIdentity, setDiscordIdentity] = React.useState<DiscordIdentity | null>(null);
  const [contactErr, setContactErr] = React.useState<string | null>(null);

  // ✅ store booked start time for success screen
  const [bookedStartISO, setBookedStartISO] = React.useState<string | null>(null);

  const config: QuickbookConfig = React.useMemo(
    () => ({
      sessionType: sessionType || "Session",
      liveMinutes,
      followups,
      liveBlocks,
      productId,
    }),
    [sessionType, liveMinutes, followups, liveBlocks, productId]
  );

  const totalMinutes = React.useMemo(() => {
    const blocks = config.liveBlocks ?? 0;
    return config.liveMinutes + blocks * 45;
  }, [config.liveMinutes, config.liveBlocks]);

  const [prefetchedSlots, setPrefetchedSlots] = React.useState<Slot[] | null>(null);
  const [prefetchError, setPrefetchError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        setPrefetchError(null);

        const start = new Date();
        start.setUTCHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setUTCDate(end.getUTCDate() + 14);
        end.setUTCHours(23, 59, 59, 999);

        const rows = await fetchSlots(start, end, totalMinutes);
        if (!ignore) setPrefetchedSlots(rows);
      } catch (e: any) {
        if (!ignore) setPrefetchError(e?.message ?? "prefetch_failed");
      }
    })();

    return () => {
      ignore = true;
    };
  }, [totalMinutes]);

  const handleRiotVerified = React.useCallback(
    async (d: RiotVerified) => {
      setRiotTag(d.riotTag);

      if (d.puuid) {
        try {
          const resp = await fetch(
            `/api/checkout/student/by-DBmatch?puuid=${encodeURIComponent(d.puuid)}`,
            { cache: "no-store" }
          );
          if (resp.ok) {
            const data = await resp.json().catch(() => null);
            if (data?.discordId && !discordIdentity?.id) {
              setDiscordIdentity({
                id: String(data.discordId),
                username: data.discordName ?? null,
              });
            }
          }
        } catch {}
      }

      try {
        setContactErr(null);

        const res = await fetch("/api/quickbook/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            riotTag: d.riotTag,
            puuid: d.puuid,
            region: d.region,
          }),
        });

        if (!res.ok) return;

        const data = await res.json().catch(() => ({}));

        if (data?.ok && data?.exists === false) {
          setContactErr("This Riot#tag isn’t eligible for quick booking.");
          return;
        }

        const expected = data?.expectedDiscordId;
        if (data?.ok && expected && discordIdentity?.id && expected !== discordIdentity.id) {
          setContactErr("This Riot#tag is linked to a different Discord account.");
        }

        if (!discordIdentity?.id && data?.discordId) {
          setDiscordIdentity({
            id: String(data.discordId),
            username: data.discordName ?? null,
          });
        }
      } catch {}
    },
    [discordIdentity?.id]
  );

  const ease = [0.2, 0.8, 0.2, 1] as const;
  const fade = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.22, ease } },
    exit: { opacity: 0, transition: { duration: 0.18, ease } },
  } as const;

  const [footerState, setFooterState] = React.useState<FooterState | null>(null);

  const canShowStep1 = step === 1 && !!discordIdentity?.id;
  const canShowStep2 = step === 2 && !!discordIdentity?.id;

  // Ensure step 2 has no footer
  React.useEffect(() => {
    if (step === 2) setFooterState(null);
  }, [step]);

  return (
    <QuickbookShell>
      <div className="flex flex-col h-full min-h-0">
        <div className="sm:px-6 pb-4 flex-1 min-h-0">
          <div
            className="
              h-full rounded-2xl ring-1 ring-[rgba(146,180,255,.20)]
              bg-[rgba(12,22,44,.72)]
              [background-image:linear-gradient(180deg,rgba(99,102,241,.12),transparent)]
              supports-[backdrop-filter]:backdrop-saturate-100
              supports-[backdrop-filter]:backdrop-contrast-125
            "
          >
            <div className="relative h-full min-h-0 px-4 pt-4">
              <AnimatePresence mode="wait" initial={false}>
                {step === 0 && (
                  <motion.div key="contact" {...fade} className="h-full min-h-0">
                    <StepQuickContact
                      riotTag={riotTag}
                      notes={notes}
                      setRiotTag={setRiotTag}
                      setNotes={setNotes}
                      discordIdentity={discordIdentity}
                      onDiscordLinked={setDiscordIdentity}
                      onRiotVerified={handleRiotVerified}
                      contactErr={contactErr}
                      onNext={() => {
                        if (contactErr) return;
                        setStep(1);
                      }}
                      setFooterState={setFooterState}
                    />
                  </motion.div>
                )}

                {canShowStep1 && (
                  <motion.div key="calendar" {...fade} className="h-full min-h-0">
                    <StepQuickCalendar
                      config={config}
                      prefetchedSlots={prefetchedSlots ?? undefined}
                      prefetchError={prefetchError}
                      riotTag={riotTag}
                      notes={notes}
                      discordIdentity={discordIdentity!}
                      onBack={() => setStep(0)}
                      onSuccess={(startISO) => {
                        setBookedStartISO(startISO);
                        setStep(2);
                      }}
                      setFooterState={setFooterState}
                    />
                  </motion.div>
                )}

                {canShowStep2 && (
                  <motion.div key="success" {...fade} className="h-full min-h-0">
                    <StepQuickSuccess bookedStartISO={bookedStartISO} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {footerState && (
          <div className="px-6 py-4 border-t border-[rgba(146,180,255,.18)] flex items-center justify-end gap-2">
            {footerState.onSecondary && (
              <OutlineCTA
                className="h-9 px-4 text-white supports-[backdrop-filter]:backdrop-blur-md
                           bg-[rgba(16,24,40,.70)] hover:bg-[rgba(20,28,48,.85)]
                           ring-1 ring-[var(--color-divider)] rounded-xl"
                onClick={footerState.onSecondary}
                disabled={!!footerState.secondaryDisabled}
              >
                {footerState.secondaryLabel ?? "Back"}
              </OutlineCTA>
            )}

            <PrimaryCTA
              withHalo={false}
              className="h-9 px-4 text-base"
              disabled={footerState.primaryDisabled}
              onClick={footerState.onPrimary}
            >
              {footerState.primaryLabel}
            </PrimaryCTA>
          </div>
        )}
      </div>
    </QuickbookShell>
  );
}