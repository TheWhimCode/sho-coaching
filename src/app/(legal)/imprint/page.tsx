// app/(legal)/imprint/page.tsx
import React from "react";

export const metadata = {
  title: "Impressum",
  description: "Legal disclosure (Impressum) according to § 5 TMG.",
};

export default function ImpressumPage() {
  return (
    <section className="relative isolate min-h-screen pt-12 md:pt-16 lg:pt-20 pb-14 text-white overflow-x-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none isolate overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#05070f_0%,#070c18_40%,#0c1528_70%,#16264a_100%)]" />
        <div className="absolute inset-0 [mask-image:radial-gradient(80%_80%_at_50%_50%,black,transparent)] bg-black/60" />
      </div>

      <div className="relative z-0 mx-auto w-full max-w-4xl px-6 md:px-8">
        <div
          className="
            relative rounded-2xl p-6 md:p-8
            bg-[linear-gradient(135deg,#11182a_0%,#0e1526_45%,#0c1322_100%)]
            border border-[rgba(146,180,255,0.12)]
            ring-1 ring-[rgba(146,180,255,0.14)]
            shadow-[0_12px_40px_rgba(0,0,0,0.5)]
            space-y-6
          "
        >
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Legal notice</h1>

          <div className="space-y-4 text-white/90 leading-relaxed">
            <p>
Legal information according to §5 TMG (German Telemedia Act)            </p>

            <p>
              <span className="font-medium">Tim Bäumler </span> 
              Sho Coaching <br />
              Emsdettener Straße 18<br />
              48268 Greven<br />
              Germany
            </p>

            <p>
              <span className="font-medium">Contact</span> <br />
              E-Mail: im.sho@yahoo.com <br />
              
            </p>

            <p>
No VAT is charged according to §19 German VAT Act (UStG).            </p>

            <p>
Responsible for content according to §55(2) RStV: <br />
              Tim Bäumler
            </p>

            <p>
              Online dispute resolution in accordance with Art. 14(1) ODR-VO: <br />
              The European Commission provides a platform for online dispute resolution (OS):{" "}
              <a
                href="https://consumer-redress.ec.europa.eu/index_en"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-white"
              >
                https://consumer-redress.ec.europa.eu/index_en
              </a>
            </p>
          </div>

          <p className="text-xs text-white/55 pt-2">Last updated: 29 November 2025</p>
        </div>
      </div>
    </section>
  );
}
