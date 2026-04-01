import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LayoutClient from "@/app/LayoutClient";
import { NavChromeProvider } from "@/app/_components/navChrome"; // <-- adjust path if needed

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sho Coaching",
  description: "Coaching & courses",
};

/** Set to `process.env.NEXT_PUBLIC_MAINTENANCE === "true"` to show the full-site maintenance screen. */
const MAINTENANCE = false;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}>
        {MAINTENANCE ? (
          <div className="min-h-dvh flex items-center justify-center p-6 text-center">
            <p className="text-xl text-white/90">Unavailable until next month.</p>
          </div>
        ) : (
          <NavChromeProvider>
            <div id="scroll-root" className="h-dvh overflow-hidden overflow-x-hidden os-loading">
              <LayoutClient>{children}</LayoutClient>
            </div>
          </NavChromeProvider>
        )}
      </body>
    </html>
  );
}
