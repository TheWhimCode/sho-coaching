"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Stripe } from "@stripe/stripe-js";
import type { Breakdown } from "@/engine/checkout";
import { appearanceDarkBrand } from "@/lib/checkout/stripeAppearance";
import {
  type PayMethod,
  type Payload,
  type PayloadForBackend,
  type DiscordIdentity,
  type SavedCard,
  type CheckoutStep,
  LAST_STEP,
  STEP_CHOOSE,
  totalLiveMinutesFromPayload,
  sessionBlockTitleFromPayload,
  mergeWithDefaultPayload,
  parseStartTime,
  buildBookingCreateBody,
  sessionFromCheckoutPayload,
} from "@/engine/checkout";
import { computePriceWithProduct } from "@/engine/session";
import { runCheckoutPayment } from "./runCheckoutPayment";

type Args = {
  payload: Payload;
  breakdown: Breakdown;
  stripePromise: Promise<Stripe | null>;
  appearance?: any;
  payloadForBackend: PayloadForBackend;
  onReturningStudentFound?: (name: string, coupon: { code: string; value: number } | null) => void;
};

export function useCheckoutFlow({
  payload,
  breakdown,
  stripePromise,
  appearance,
  payloadForBackend,
  onReturningStudentFound,
}: Args) {
  const appearanceToUse = appearance ?? appearanceDarkBrand;
  const safePayload: Payload = useMemo(
    () => mergeWithDefaultPayload(payload),
    [payload]
  );

  const sessionBlockTitle = useMemo(
    () => sessionBlockTitleFromPayload(safePayload),
    [safePayload]
  );

  const totalLiveMinutes = useMemo(
    () => totalLiveMinutesFromPayload(safePayload),
    [safePayload]
  );

const [step, setStep] = useState<CheckoutStep>(0);
  const [dir, setDir] = useState<1 | -1>(1);

  const goNext = () => {
    setDir(1);
    setStep((s) => (s >= LAST_STEP ? LAST_STEP : ((s + 1) as CheckoutStep)));
  };

  const goBack = () => {
    setDir(-1);
    setStep((s) => (s <= 0 ? 0 : ((s - 1) as CheckoutStep)));
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
  const [studentName, setStudentName] = useState<string | null>(null);
  const [studentCoupon, setStudentCoupon] = useState<{ code: string; value: number } | null>(null);
  const [champion, setChampion] = useState<string | null>(null);
  const [champion2, setChampion2] = useState<string | null>(null);
  const currentMethodRef = useRef<PayMethod>("");
  const [waiver, setWaiver] = useState(false);

  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const applyCoupon = (amount: number, code: string) => {
    setCouponDiscount(amount);
    setCouponCode(code);
  };

  const handleChampionChange = (champ: string) => {
    setChampion(champ);
    setChampion2((prev) => (prev === champ ? null : prev));
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
    const fromBackend = parseStartTime(payloadForBackend?.startTime);
    const fromPayload = parseStartTime(safePayload.startTime);
    if (fromBackend) setSelectedStart(fromBackend);
    else if (fromPayload) setSelectedStart(fromPayload);
    else if (typeof window !== "undefined") {
      const fromQuery = parseStartTime(
        new URLSearchParams(window.location.search).get("startTime") ?? undefined
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

  // Hydrate coupon from session when we have a booking but no client-side coupon state (e.g. after refresh)
  useEffect(() => {
    if (!bookingId || couponDiscount !== 0 || couponCode !== null) return;
    let cancelled = false;
    fetch(`/api/checkout/booking-coupon?bookingId=${encodeURIComponent(bookingId)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (cancelled || !data) return;
        if (data.couponDiscount > 0) setCouponDiscount(data.couponDiscount);
        if (data.couponCode) setCouponCode(data.couponCode);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [bookingId]);

  const handleRiotVerified = async ({ riotTag: verifiedTag, puuid }: any) => {
    setRiotTag(verifiedTag);
    try {
      const resp = await fetch(
        `/api/checkout/student/by-DBmatch?puuid=${encodeURIComponent(puuid)}`,
        { cache: "no-store" }
      );
      if (resp.ok) {
        const data = await resp.json().catch(() => null);
        if (data?.studentId) {
          setStudentId(String(data.studentId));
          const name = data?.name ?? data?.discordName ?? "there";
          if (data?.name) setStudentName(String(data.name));
          const val = data?.coupon?.value != null ? Number(data.coupon.value) : NaN;
          const coupon = data?.coupon && typeof data.coupon.code === "string" && !Number.isNaN(val)
            ? { code: data.coupon.code, value: val }
            : null;
          setStudentCoupon(coupon);
          onReturningStudentFound?.(name, coupon);
        } else {
          setStudentName(null);
          setStudentCoupon(null);
        }
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
        if (data?.studentId) {
          setStudentId(String(data.studentId));
          const name = data?.name ?? u.username ?? "there";
          if (data?.name) setStudentName(String(data.name));
          const val = data?.coupon?.value != null ? Number(data.coupon.value) : NaN;
          const coupon = data?.coupon && typeof data.coupon.code === "string" && !Number.isNaN(val)
            ? { code: data.coupon.code, value: val }
            : null;
          setStudentCoupon(coupon);
          onReturningStudentFound?.(name, coupon);
        } else {
          setStudentName(null);
          setStudentCoupon(null);
        }
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

setDir(1);
setStep(3);  // summary + pay is now step 3

    setLoadingIntent(true);

    try {
      const body = buildBookingCreateBody(
        safePayload,
        sessionBlockTitle,
        totalLiveMinutes,
        {
          studentId: studentId ?? null,
          riotTag,
          discordId: discordIdentity?.id ?? null,
          discordName: discordIdentity?.username ?? null,
          notes,
        },
        waiver,
        { code: couponCode, discount: couponDiscount },
        [champion, champion2].filter((c): c is string => !!c)
      );
      const make = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!make.ok) {
        // 409 = hold_expired: send back to choose step so user can click Back to reselect time
        if (make.status === 409) setStep(STEP_CHOOSE);
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
        body: JSON.stringify({
          bookingId,
          payMethod,
          holdKey: safePayload.holdKey,
          productId: safePayload.productId,
        }),
      });

      if (res.status === 409) {
        console.warn("Selected start time can’t fit this duration.");
        setStep(STEP_CHOOSE);
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

  const runPayment = async (paymentElementId?: string): Promise<void> => {
    const stripe = await stripePromise;
    if (!stripe) return;
    // Card flow: session route computes amount from booking + couponDiscount; we still send amountCents for fallback when no bookingId
    const session = sessionFromCheckoutPayload(safePayload);
    const { priceEUR } = computePriceWithProduct(session);
    const amountCents = Math.round((priceEUR - couponDiscount) * 100);
    await runCheckoutPayment({
      stripe,
      payMethod,
      bookingId,
      clientSecret,
      createPaymentIntent,
      slotIds: safePayload.slotIds,
      amountCents,
      productId: safePayload.productId,
      paymentElementId,
    });
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
    studentName,
    studentCoupon,

    champion,
    setChampion,
    handleChampionChange,
    champion2,
    setChampion2,

    waiver,
    setWaiver,

    chooseAndGo,
    createPaymentIntent,
    runPayment,
    handleRiotVerified,
    handleDiscordLinked,

    couponCode,
    setCouponCode,
    couponDiscount,
    applyCoupon,
  };
}
