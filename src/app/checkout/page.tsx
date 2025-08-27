// app/checkout/page.tsx (SERVER)
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Suspense } from "react";
import CheckoutClient from "./CheckoutClient";
import TransitionProvider from "@/app/transition/checkout-in";

export default function Page() {
  return (
    <TransitionProvider>
      <Suspense fallback={null}>
        <CheckoutClient />
      </Suspense>
    </TransitionProvider>
  );
}
