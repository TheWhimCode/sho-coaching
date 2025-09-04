// app/checkout/page.tsx (SERVER)
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Suspense } from "react";
import CheckoutClient from "./CheckoutClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CheckoutClient />
    </Suspense>
  );
}
