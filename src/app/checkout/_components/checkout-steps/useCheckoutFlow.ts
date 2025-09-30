"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Stripe } from "@stripe/stripe-js";
import type { Breakdown } from "@/lib/checkout/buildBreakdown";
import { appearanceDarkBrand } from "@/lib/checkout/stripeAppearance";
import { getPreset } from "@/lib/sessions/preset";

/** ---- Shared types (match your previous local types) ---- */
export type PayMethod = "" | "card" | "paypal" | "revolut_pay" | "klarna";

export type Payload = {
  slotId: string;
  sessionType: string;
  baseMinutes: number;
  liveMinutes: number;
  followups: number;
  liveBlocks: number;
  preset: string;
  holdKey: string;
  startTime?: string | number;
};

export type PayloadForBackend = Pick<
  Payload,
  "slotId" | "sessionType" | "liveMinutes" | "followups" | "liveBlocks" | "preset" | "holdKey"
> & {
  startTime?: string | number | Date;
};

export type DiscordIdentity = { id: string; username?: string | null; globalName?: string | null };

export type SavedCard = {
  id: string;
  brand: string | null;
  last4: string | null;
  exp_month: number | null;
  exp_year: number | null;
};

type Args = {
  payload: Payload;
  breakdown: Breakdown;
  stripePromise: Promise<Stripe | null>;
  appearance?: any;
  payloadForBackend: PayloadForBackend;
};

const DEFAULT_PAYLOAD: Payload = {
  slotId: "",
  sessionType: "",
  baseMinutes: 60,
  liveMinutes: 60,
  followups: 0,
  liveBlocks: 0,
  preset: "",
  holdKey: "",
};

/** ---- The main hook that holds all state/logic ---- */
export function useCheckoutFlow({
  payload,
  breakdown,
  stripePromise,
  appearance,
  payloadForBackend,
}: Args) {
  const appearanceToUse = appearance ?? appearanceDarkBrand;
  const safePayload: Payload = useMemo(() => ({ ...DEFAULT_PAYLOAD, ...payload }), [payload]);

  const sessionBlockTitle = useMemo(() => {
    const p = getPreset(safePayload.baseMinutes, safePayload.followups, safePayload.liveBlocks);
    return p === "vod" ? "VOD Review" : p === "instant" ? "Instant Insight" : p === "signature" ? "Signature Session" : "Custom Session";
  }, [safePayload.baseMinutes, safePayload.followups, safePayload.liveBlocks]);

  const totalLiveMinutes = useMemo(
    () => safePayload.baseMinutes + safePayload.liveBlocks * 45,
    [safePayload.baseMinutes, safePayload.liveBlocks]
  );

  // Steps
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const goNext = () => { setDir(1); setStep((s) => (s === 3 ? 3 : ((s + 1) as 0 | 1 | 2 | 3))); };
  const goBack = () => { setDir(-1); setStep((s) => (s === 0 ? 0 : ((s - 1) as 0 | 1 | 2 | 3))); };

  // Payment / intent state
  const [payMethod, setPayMethod] = useState<PayMethod>("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [piId, setPiId] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const [cardPmId, setCardPmId] = useState<string | null>(null);
  const [savedCard, setSavedCard] = useState<SavedCard | null>(null);

  // Contact state
  const [riotTag, setRiotTag] = useState("");
  const [notes, setNotes] = useState("");
  const [discordIdentity, setDiscordIdentity] = useState<DiscordIdentity | null>(null);

  const discordDisplay = useMemo(
    () => discordIdentity?.globalName || discordIdentity?.username || "",
    [discordIdentity]
  );

  const currentMethodRef = useRef<PayMethod>("");
  const [waiver, setWaiver] = useState(false);

  // Track last verified PUUID to clear stale Discord if identity changes
  const lastPuuidRef = useRef<string | null>(null);

  // Selected start time (for SessionBlock header)
  const [selectedStart, setSelectedStart] = useState<Date | null>(null);
  useEffect(() => {
    function coerceToDate(v: unknown): Date | null {
      if (v == null) return null;
      if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
      if (typeof v === "number") {
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
        }
      if (typeof v === "string") {
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
      }
      return null;
    }

    const fromPayloadBackend = coerceToDate(payloadForBackend?.startTime);
    const fromPayload = coerceToDate(safePayload.startTime);

    if (fromPayloadBackend) { setSelectedStart(fromPayloadBackend); return; }
    if (fromPayload) { setSelectedStart(fromPayload); return; }

    if (typeof window !== "undefined") {
      const s = new URLSearchParams(window.location.search).get("startTime");
      const fromQuery = coerceToDate(s || undefined);
      if (fromQuery) setSelectedStart(fromQuery);
    }
  }, [payloadForBackend, safePayload]);

  /** When RiotTag verifies: create/update unpaid session + try to auto-fill Discord by PUUID */
  const handleRiotVerified = async ({
    riotTag: verifiedTag,
    puuid,
  }: {
    riotTag: string;
    puuid: string;
    region: string;
  }) => {
    setRiotTag(verifiedTag);

    const puuidChanged = lastPuuidRef.current && lastPuuidRef.current !== puuid;
    let effectiveBookingId = bookingId;

    // Ensure unpaid session exists/updated with latest RiotTag (idempotent by slotId)
    try {
      const make = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionType: sessionBlockTitle,
          slotId: safePayload.slotId,
          liveMinutes: totalLiveMinutes,
          followups: safePayload.followups,
          riotTag: verifiedTag,
          notes,
          waiverAccepted: waiver,
        }),
      });

      if (make.ok) {
        const j = await make.json().catch(() => ({}));
        if (!effectiveBookingId && j?.bookingId) {
          effectiveBookingId = j.bookingId as string;
          setBookingId(effectiveBookingId);
        }
      } else {
        console.warn("CREATE/UPDATE_BOOKING_ON_VERIFY_FAILED", await make.text().catch(() => ""));
      }
    } catch { /* ignore */ }

    // If the identity changed, clear stale Discord in UI
    if (puuidChanged) {
      setDiscordIdentity(null);
      // (Optional) clear on server as well if you support nulls in attach endpoint
      // if (effectiveBookingId) {
      //   await fetch("/api/booking/attach-discord", {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({ bookingId: effectiveBookingId, discordId: null, discordName: null }),
      //   }).catch(() => {});
      // }
    }

    // Lookup Student by PUUID to auto-fill Discord if known
    try {
      const resp = await fetch(`/api/checkout/student/by-puuid?puuid=${encodeURIComponent(puuid)}`, { cache: "no-store" }).catch(() => null);
      if (resp?.ok) {
        const data = await resp.json().catch(() => null);
        if (data?.discordId) {
          const identity: DiscordIdentity = {
            id: String(data.discordId),
            globalName: data.discordName ?? null,
            username: data.discordName ?? null,
          };
          setDiscordIdentity(identity);

          if (effectiveBookingId) {
            await fetch("/api/booking/attach-discord", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                bookingId: effectiveBookingId,
                discordId: identity.id,
                discordName: identity.globalName || identity.username || null,
              }),
            }).catch(() => {});
          }
        }
      }
    } catch { /* ignore */ }

    lastPuuidRef.current = puuid;
  };

  /** Discord OAuth success */
  const handleDiscordLinked = async (u: DiscordIdentity) => {
    setDiscordIdentity(u);
    if (bookingId) {
      await fetch("/api/booking/attach-discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          discordId: u.id,
          discordName: u.globalName || u.username || null,
        }),
      }).catch(() => {});
    }
  };

  /** Choose method -> create PI (and booking if needed) then go to Step 2 */
  async function chooseAndGo(m: PayMethod) {
    if (!m) return;
    setDir(1);
    setPayMethod(m);
    currentMethodRef.current = m;

    // Reset Stripe state ONLY when the user changes the method
    setClientSecret(null);
    setPiId(null);
    setCardPmId(null);
    setSavedCard(null);

    setStep(2);
    setLoadingIntent(true);

    try {
      let bid = bookingId;

      // Create the booking once if not created during Riot verify
      if (!bid) {
        const make = await fetch("/api/booking/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionType: sessionBlockTitle,
            slotId: safePayload.slotId,
            liveMinutes: totalLiveMinutes,
            followups: safePayload.followups,
            riotTag,
            discordId: discordIdentity?.id ?? null,
            discordName: discordDisplay || null,
            notes,
            waiverAccepted: waiver,
          }),
        });

        if (!make.ok) {
          console.error("CREATE_BOOKING_FAILED", await make.json().catch(() => ({})));
          setLoadingIntent(false);
          return;
        }

        const j = await make.json();
        bid = j.bookingId as string;
        setBookingId(bid);

        // Persist Discord link immediately if we have it
        if (discordIdentity?.id) {
          await fetch("/api/booking/attach-discord", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookingId: j.bookingId,
              discordId: discordIdentity.id,
              discordName: discordDisplay || null,
            }),
          }).catch(() => {});
        }
      }

      // Create a PI for this booking & method
      const res = await fetch("/api/stripe/checkout/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: bid, payMethod: m }),
      });

      if (res.status === 409) {
        console.warn("Selected start time can’t fit this duration. Choose another start or shorten the session.");
        setStep(0);
        setLoadingIntent(false);
        return;
      }

      const data = await res.json().catch(() => ({} as any));
      if (currentMethodRef.current !== m) return;

      if (res.ok && data?.clientSecret) {
        setClientSecret(data.clientSecret);
        setPiId(String(data.clientSecret).split("_secret")[0] || null);
      } else {
        console.error("INTENT_FAIL", data);
        setClientSecret(null);
        setPiId(null);
      }
    } finally {
      if (currentMethodRef.current === m) setLoadingIntent(false);
    }
  }

  return {
    // Expose original inputs too
    payload: safePayload,
    breakdown,
    stripePromise,
    appearance: appearanceToUse,

    // SessionBlock helpers
    sessionBlockTitle,
    selectedStart,

    // Step state
    step,
    dir,
    goNext,
    goBack,

    // Payment state
    payMethod,
    clientSecret,
    piId,
    loadingIntent,
    bookingId,
    setCardPmId,
    setSavedCard,
    savedCard,

    // Contact state
    riotTag,
    setRiotTag,
    notes,
    setNotes,
    discordIdentity,
    waiver,
    setWaiver,

    // Handlers
    handleRiotVerified,
    handleDiscordLinked,
    chooseAndGo,
  };
}
