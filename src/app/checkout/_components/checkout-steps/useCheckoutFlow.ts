"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Stripe } from "@stripe/stripe-js";
import type { Breakdown } from "@/lib/checkout/buildBreakdown";
import { appearanceDarkBrand } from "@/lib/checkout/stripeAppearance";

// ⭐ new imports
import { getPreset } from "@/engine/session/rules/preset";
import { titlesByPreset } from "@/engine/session";
import type { ProductId } from "@/engine/session/model/product";

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
  productId?: string | null;
};

export type PayloadForBackend = Pick<
  Payload,
  | "slotId"
  | "sessionType"
  | "liveMinutes"
  | "followups"
  | "liveBlocks"
  | "preset"
  | "holdKey"
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
  const safePayload: Payload = useMemo(
    () => ({ ...DEFAULT_PAYLOAD, ...payload }),
    [payload]
  );

  // ⭐ correct version (bundle-safe)
  const sessionBlockTitle = useMemo(() => {
    const p = getPreset(
      safePayload.baseMinutes,
      safePayload.followups,
      safePayload.liveBlocks,
      safePayload.productId as ProductId | undefined
    );
    return titlesByPreset[p];
  }, [
    safePayload.baseMinutes,
    safePayload.followups,
    safePayload.liveBlocks,
    safePayload.productId,
  ]);

  const totalLiveMinutes = useMemo(
    () => safePayload.baseMinutes + safePayload.liveBlocks * 45,
    [safePayload.baseMinutes, safePayload.liveBlocks]
  );

  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const goNext = () => {
    setDir(1);
    setStep((s) => (s === 3 ? 3 : ((s + 1) as 0 | 1 | 2 | 3)));
  };
  const goBack = () => {
    setDir(-1);
    setStep((s) => (s === 0 ? 0 : ((s - 1) as 0 | 1 | 2 | 3)));
  };

  const [payMethod, setPayMethod] = useState<PayMethod>("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [piId, setPiId] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const [cardPmId, setCardPmId] = useState<string | null>(null);
  const [savedCard, setSavedCard] = useState<SavedCard | null>(null);

  const [riotTag, setRiotTag] = useState("");
  const [notes, setNotes] = useState("");
  const [discordIdentity, setDiscordIdentity] =
    useState<DiscordIdentity | null>(null);

  const [studentId, setStudentId] = useState<string | null>(null);
  const currentMethodRef = useRef<PayMethod>("");
  const [waiver, setWaiver] = useState(false);

  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const applyCoupon = (amount: number, code: string) => {
    setCouponDiscount(amount);
    setCouponCode(code);
  };

  useEffect(() => {
    if (!bookingId || !waiver) return;
    fetch("/api/booking/update-waiver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, waiverAccepted: true }),
    }).catch(() => {});
  }, [bookingId, waiver]);

  const lastPuuidRef = useRef<string | null>(null);
  const [selectedStart, setSelectedStart] = useState<Date | null>(null);

  useEffect(() => {
    function coerceToDate(v: unknown): Date | null {
      if (v == null) return null;
      if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
      if (typeof v === "number")
        return isNaN(new Date(v).getTime()) ? null : new Date(v);
      if (typeof v === "string")
        return isNaN(new Date(v).getTime()) ? null : new Date(v);
      return null;
    }
    const fromBackend = coerceToDate(payloadForBackend?.startTime);
    const fromPayload = coerceToDate(safePayload.startTime);
    if (fromBackend) setSelectedStart(fromBackend);
    else if (fromPayload) setSelectedStart(fromPayload);
    else if (typeof window !== "undefined") {
      const fromQuery = coerceToDate(
        new URLSearchParams(window.location.search).get("startTime") ||
          undefined
      );
      if (fromQuery) setSelectedStart(fromQuery);
    }
  }, [payloadForBackend, safePayload]);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.search.includes("canceled")
    ) {
      setClientSecret(null);
      setBookingId(null);
    }
  }, []);

  const handleRiotVerified = async ({ riotTag: verifiedTag, puuid }: any) => {
    setRiotTag(verifiedTag);
    try {
      const resp = await fetch(
        `/api/checkout/student/by-DBmatch?puuid=${encodeURIComponent(puuid)}`,
        { cache: "no-store" }
      );
      if (resp.ok) {
        const data = await resp.json().catch(() => null);
        if (data?.studentId) setStudentId(String(data.studentId));
        if (data?.discordId)
          setDiscordIdentity({
            id: String(data.discordId),
            username: data.discordName ?? null,
          });
      }
    } catch {}
    lastPuuidRef.current = puuid;
  };

  const handleDiscordLinked = async (u: DiscordIdentity) => {
    setDiscordIdentity({ id: u.id, username: u.username ?? null });
    try {
      const resp = await fetch(
        `/api/checkout/student/by-DBmatch?discordId=${encodeURIComponent(
          u.id
        )}`,
        { cache: "no-store" }
      );
      if (resp.ok) {
        const data = await resp.json().catch(() => null);
        if (data?.studentId) setStudentId(String(data.studentId));
      }
    } catch {}
  };

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
      const make = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: studentId ?? null,
          sessionType: sessionBlockTitle,
          slotId: safePayload.slotId,
          liveMinutes: totalLiveMinutes,
          followups: safePayload.followups,
          riotTag,
          discordId: discordIdentity?.id ?? null,
          discordName: discordIdentity?.username ?? null,
          notes,
          waiverAccepted: waiver,
          couponCode,
          couponDiscount,
        }),
      });

      if (!make.ok) {
        if (make.status === 409) setStep(0);
        setLoadingIntent(false);
        return;
      }

      const j = await make.json();
      setBookingId(j.bookingId as string);
    } finally {
      setLoadingIntent(false);
    }
  }

  const createPaymentIntent = async (): Promise<string | null> => {
    if (!bookingId || !payMethod) return null;
    setLoadingIntent(true);
    try {
      const res = await fetch("/api/stripe/checkout/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, payMethod }),
      });

      if (res.status === 409) {
        console.warn("Selected start time can’t fit this duration.");
        setStep(0);
        return null;
      }

      const data = await res.json().catch(() => ({} as any));

      let sec: string | null = null;

      if (data?.clientSecret) {
        sec = data.clientSecret as string;
      } else if (data?.client_secret) {
        sec = data.client_secret as string;
      }

      if (sec) {
        setClientSecret(sec);
        setPiId(String(sec).split("_secret")[0] || null);
        return sec;
      } else {
        console.error("INTENT_FAIL", data);
        setClientSecret(null);
        setPiId(null);
        return null;
      }
    } finally {
      setLoadingIntent(false);
    }
  };

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

    studentId,
    setStudentId,

    waiver,
    setWaiver,

    chooseAndGo,
    createPaymentIntent,
    handleRiotVerified,
    handleDiscordLinked,

    couponCode,
    setCouponCode,
    couponDiscount,
    applyCoupon,
  };
}
