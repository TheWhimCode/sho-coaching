// app/checkout/page.tsx (SERVER)
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Suspense } from "react";
import { redirect } from "next/navigation";
import CheckoutClient from "./CheckoutClient";
import { COACHING_SALES_ENABLED } from "@/lib/coaching/coachingSales";

export const metadata = {
  title: "Checkout",
  description: "Secure checkout for your League of Legends coaching session with Mino.",
};

export default function Page() {
  if (!COACHING_SALES_ENABLED) {
    redirect("/coaching");
  }

  return (
    <Suspense fallback={null}>
      <CheckoutClient />
    </Suspense>
  );
}
