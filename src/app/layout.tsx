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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}>
        <NavChromeProvider>
          <div id="scroll-root" className="h-dvh overflow-hidden overflow-x-hidden os-loading">
            <LayoutClient>{children}</LayoutClient>
          </div>
        </NavChromeProvider>
      </body>
    </html>
  );
}
