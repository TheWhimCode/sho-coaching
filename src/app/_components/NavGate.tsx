// app/_components/NavGate.tsx
"use client";
import { usePathname } from "next/navigation";

export default function NavGate({ children }: { children: React.ReactNode }) {
  const p = usePathname() || "";
  const hide = /^\/coaching\/[^/]+$/.test(p); // matches /coaching/vod etc.
  return hide ? null : <>{children}</>;
}
