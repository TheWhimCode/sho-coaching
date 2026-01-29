"use client";

import { usePathname } from "next/navigation";
import NavBar from "@/app/_components/NavBar";
import Footer from "@/app/_components/Footer";
import ScrollbarInit from "@/app/ScrollbarInit";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const p = usePathname() || "";

  const hideCoaching = /^\/coaching\/[^/]+\/?$/.test(p);
  const hideCheckout =
    p === "/checkout" ||
    (p.startsWith("/checkout/") && !p.startsWith("/checkout/success"));
  const hideSkillcheckNavbar = p === "/skillcheck" || p.startsWith("/skillcheck/");

  const showNavBar = !(hideCoaching || hideCheckout || hideSkillcheckNavbar);
  const showFooter = !(hideCoaching || hideCheckout);

  return (
    <>
      <ScrollbarInit />
      {showNavBar && <NavBar />}
      {showNavBar && <div className="h-16 md:h-20" />}

      <main>{children}</main>

      {showFooter && <Footer />}
    </>
  );
}