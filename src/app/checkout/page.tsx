// app/checkout/page.tsx (SERVER)
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Suspense } from "react";
import CheckoutClient from "./CheckoutClient";

export const metadata = {
  title: "Checkout | Sho",
  description: "Secure checkout for a coaching session with Sho. Fast, easy, and safe payment processing.",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CheckoutClient />
    </Suspense>
  );
}
