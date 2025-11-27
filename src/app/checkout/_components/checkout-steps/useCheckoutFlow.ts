// src/app/(wherever)/useCheckoutFlow.ts
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Stripe } from "@stripe/stripe-js";
import type { Breakdown } from "@/lib/checkout/buildBreakdown";
import { appearanceDarkBrand } from "@/lib/checkout/stripeAppearance";
import { getPreset } from "@/lib/sessions/preset";

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

export type DiscordIdentity = { id: string; username?: string | null };

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

  const currentMethodRef = useRef<PayMethod>("");
  const [waiver, setWaiver] = useState(false);
  // persist waiver AFTER booking exists
useEffect(() => {
  if (!bookingId) return;
  if (!waiver) return;

  fetch("/api/booking/update-waiver", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bookingId,
      waiverAccepted: true,
    }),
  }).catch(() => {});
}, [bookingId, waiver]);


  // Track last verified PUUID to clear stale Discord if identity changes
  const lastPuuidRef = useRef<string | null>(null);

  // Selected start time (if any)
  const [selectedStart, setSelectedStart] = useState<Date | null>(null);
  useEffect(() => {
    function coerceToDate(v: unknown): Date | null {
      if (v == null) return null;
      if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
      if (typeof v === "number") { const d = new Date(v); return isNaN(d.getTime()) ? null : d; }
      if (typeof v === "string") { const d = new Date(v); return isNaN(d.getTime()) ? null : d; }
      return null;
    }
    const fromBackend = coerceToDate(payloadForBackend?.startTime);
    const fromPayload = coerceToDate(safePayload.startTime);
    if (fromBackend) { setSelectedStart(fromBackend); return; }
    if (fromPayload) { setSelectedStart(fromPayload); return; }
    if (typeof window !== "undefined") {
      const s = new URLSearchParams(window.location.search).get("startTime");
      const fromQuery = coerceToDate(s || undefined);
      if (fromQuery) setSelectedStart(fromQuery);
    }
  }, [payloadForBackend, safePayload]);

  /** When RiotTag verifies: ONLY local changes; optional Discord autofill (read-only) */
  const handleRiotVerified = async ({
    riotTag: verifiedTag,
    puuid,
    region,
  }: { riotTag: string; puuid: string; region: string }) => {
    setRiotTag(verifiedTag);

    const puuidChanged = lastPuuidRef.current && lastPuuidRef.current !== puuid;
    if (puuidChanged) setDiscordIdentity(null);

    // Autofill by PUUID (read-only)
    try {
      const resp = await fetch(`/api/checkout/student/by-puuid?puuid=${encodeURIComponent(puuid)}`, { cache: "no-store" });
      if (resp.ok) {
        const data = await resp.json().catch(() => null);
        if (data?.discordId) {
          setDiscordIdentity({
            id: String(data.discordId),
            username: data.discordName ?? null, // treat stored name as username
          });
        }
      }
    } catch {}
    lastPuuidRef.current = puuid;
  };

  /** Discord OAuth success: local state only; persist on Continue */
  const handleDiscordLinked = async (u: DiscordIdentity) => {
    setDiscordIdentity({ id: u.id, username: u.username ?? null });
  };

  /** Continue flow: (up)create booking with latest Riot+Discord, then create PI */
  async function chooseAndGo(m: PayMethod) {
    if (!m) return;
    setDir(1);
    setPayMethod(m);
    currentMethodRef.current = m;

    setClientSecret(null);
    setPiId(null);
    setCardPmId(null);
    setSavedCard(null);

    setStep(2);
    setLoadingIntent(true);

    try {
      // Upsert unpaid booking by slotId
      const make = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionType: sessionBlockTitle,
          slotId: safePayload.slotId,
          liveMinutes: totalLiveMinutes,
          followups: safePayload.followups,
          riotTag,                                      // latest
          discordId: discordIdentity?.id ?? null,       // id
          discordName: discordIdentity?.username ?? null, // username only
          notes,
          waiverAccepted: waiver,
        }),
      });

      if (!make.ok) {
        if (make.status === 409) {
          console.warn("Selected start time can’t fit this duration. Choose another start or shorten the session.");
          setStep(0);
        } else {
          console.error("CREATE/UPDATE_BOOKING_FAILED", await make.text().catch(() => ""));
        }
        setLoadingIntent(false);
        return;
      }

      const j = await make.json();
      const bid = j.bookingId as string;
      setBookingId(bid);

      // Create PaymentIntent for this booking & method
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
    payload: safePayload,
    breakdown,
    stripePromise,
    appearance: appearanceToUse,

    sessionBlockTitle,
    selectedStart,

    step,
    dir,
    goNext,
    goBack,

    payMethod,
    clientSecret,
    piId,
    loadingIntent,
    bookingId,
    setCardPmId,
    setSavedCard,
    savedCard,

    riotTag,
    setRiotTag,
    notes,
    setNotes,
    discordIdentity,
    waiver,
    setWaiver,

    handleRiotVerified,   // read-only
    handleDiscordLinked,  // local only; persist on Continue
    chooseAndGo,          // upsert booking with id+username
  };
}
