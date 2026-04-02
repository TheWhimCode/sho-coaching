"use client";

import { usePathname } from "next/navigation";
import NavBar from "@/app/_components/NavBar";
import MobileNav from "@/app/_components/MobileNav";
import Footer from "@/app/_components/Footer";
import ScrollbarInit from "@/app/ScrollbarInit";
import SpeedReviewsPageBackground from "@/app/speed-reviews/SpeedReviewsPageBackground";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const p = usePathname() || "";

  // pages where you previously hid stuff
  const isCoachingDetail = /^\/coaching\/[^/]+\/?$/.test(p);

  const isCheckout =
    p === "/checkout" ||
    (p.startsWith("/checkout/") && !p.startsWith("/checkout/success"));

  const isCheckoutSuccess = p === "/checkout/success";

  const isSkillcheck = p === "/skillcheck" || p.startsWith("/skillcheck/");

  const isQuickbook = p === "/quickbook" || p.startsWith("/quickbook/");

  const isSpeedReviews = p === "/speed-reviews" || p.startsWith("/speed-reviews/");

  const logoOnly =
    isSkillcheck ||
    isCoachingDetail ||
    isCheckout ||
    isCheckoutSuccess ||
    isQuickbook ||
    isSpeedReviews;

  const showNavBar = true;

const showFooter = !(isCoachingDetail || isCheckout || isQuickbook);
  const showNavSpacer = showNavBar && !logoOnly;

  return (
    <>
      <ScrollbarInit />

      <MobileNav />
      <NavBar logoOnly={logoOnly} />

      <div className={showNavSpacer ? "h-16 md:h-20" : "h-0"} />

      {isSpeedReviews ? (
        <div className="relative">
          <SpeedReviewsPageBackground />
          <main className="relative z-10">{children}</main>
          <div
            className={
              showFooter ? "relative z-10" : "hidden pointer-events-none"
            }
          >
            <Footer />
          </div>
        </div>
      ) : (
        <>
          <main>{children}</main>
          <div className={showFooter ? "" : "hidden pointer-events-none"}>
            <Footer />
          </div>
        </>
      )}
    </>
  );
}
