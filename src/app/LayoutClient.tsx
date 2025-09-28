// app/_components/LayoutClient.tsx
"use client";

import { usePathname } from "next/navigation";
import NavBar from "@/app/_components/NavBar";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const p = usePathname() || "";

  // Hide on: /coaching/<slug>
  const hideCoaching = /^\/coaching\/[^/]+\/?$/.test(p);

  // Hide on: /checkout and /checkout/* …but NOT /checkout/success (or deeper)
  const hideCheckout =
    p === "/checkout" ||
    (p.startsWith("/checkout/") && !p.startsWith("/checkout/success"));

  const showNav = !(hideCoaching || hideCheckout);

  return (
    <>
      {showNav && <NavBar />}
      {/* Match NavBar height (h-16 md:h-20) → pad for the larger one */}
<main className={showNav ? "pt-16 md:pt-20" : ""}>{children}</main>
    </>
  );
}
