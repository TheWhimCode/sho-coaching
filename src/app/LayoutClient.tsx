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

// LayoutClient.tsx
return (
  <>
    {showNav && <NavBar />}
    {showNav && <div className="h-16 md:h-20" />} {/* spacer */}
    <main>{children}</main> {/* no pt-* here */}
  </>
);

}
