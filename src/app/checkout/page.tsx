// app/checkout/page.tsx (SERVER)
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Suspense } from "react";
import CheckoutClient from "./CheckoutClient";

export const metadata = {
  title: "Checkout",
  description: "Secure checkout for your League of Legends coaching session with Mino.",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CheckoutClient />
    </Suspense>
  );
}
