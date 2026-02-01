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

  // ✅ logo-only on all these
  const logoOnly = isSkillcheck || isCoachingDetail || isCheckout;

  // ✅ navbar always renders (logo-only will hide the bar part)
  const showNavBar = true;

  // keep your old footer rule (hide on coaching detail + checkout)
  const showFooter = !(isCoachingDetail || isCheckout);

  // ✅ spacer only on “full navbar” pages
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
