"use client";

import { usePathname } from "next/navigation";
import NavBar from "@/app/_components/NavBar";
import Footer from "@/app/_components/Footer";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const p = usePathname() || "";

  const hideCoaching = /^\/coaching\/[^/]+\/?$/.test(p);
  const hideCheckout =
    p === "/checkout" ||
    (p.startsWith("/checkout/") && !p.startsWith("/checkout/success"));

  const showChrome = !(hideCoaching || hideCheckout);

  return (
    <>
      {showChrome && <NavBar />}
      {showChrome && <div className="h-16 md:h-20" />}

      <main>{children}</main>

      {showChrome && <Footer />} {/* ✅ footer added */}
    </>
  );
}
