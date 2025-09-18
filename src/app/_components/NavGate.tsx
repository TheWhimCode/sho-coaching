// app/_components/NavGate.tsx
"use client";
import { usePathname } from "next/navigation";

export default function NavGate({ children }: { children: React.ReactNode }) {
  const p = usePathname() || "";

  // Hide on: /coaching/<slug>
  const hideCoaching = /^\/coaching\/[^/]+\/?$/.test(p);

  // Hide on: /checkout and /checkout/* …but NOT /checkout/success (or deeper)
  const hideCheckout =
    p === "/checkout" ||
    (p.startsWith("/checkout/") && !p.startsWith("/checkout/success"));

  const hide = hideCoaching || hideCheckout;

  return hide ? null : <>{children}</>;
}
