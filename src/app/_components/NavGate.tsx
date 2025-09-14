// app/_components/NavGate.tsx
"use client";
import { usePathname } from "next/navigation";

export default function NavGate({ children }: { children: React.ReactNode }) {
  const p = usePathname() || "";

  // Hide on /coaching/[something] and /checkout (with all subroutes)
  const hide =
    /^\/coaching\/[^/]+$/.test(p) || /^\/checkout(\/.*)?$/.test(p);

  return hide ? null : <>{children}</>;
}
