"use client";

import { usePathname } from "next/navigation";
import NavBar from "@/app/_components/NavBar";
import Footer from "@/app/_components/Footer";
import ScrollbarInit from "@/app/ScrollbarInit";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const p = usePathname() || "";

  // pages where you previously hid stuff
  const isCoachingDetail = /^\/coaching\/[^/]+\/?$/.test(p);

  const isCheckout =
    p === "/checkout" ||
    (p.startsWith("/checkout/") && !p.startsWith("/checkout/success"));

  const isSkillcheck = p === "/skillcheck" || p.startsWith("/skillcheck/");

  const isQuickbook = p === "/quickbook" || p.startsWith("/quickbook/");
  
  const logoOnly = isSkillcheck || isCoachingDetail || isCheckout || isQuickbook;

  const showNavBar = true;

const showFooter = !(isCoachingDetail || isCheckout || isQuickbook);
  const showNavSpacer = showNavBar && !logoOnly;

  return (
    <>
      <ScrollbarInit />

      <NavBar logoOnly={logoOnly} />

      <div className={showNavSpacer ? "h-16 md:h-20" : "h-0"} />

      <main>{children}</main>

      <div className={showFooter ? "" : "hidden pointer-events-none"}>
        <Footer />
      </div>
    </>
  );
}
