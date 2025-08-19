// app/sessions/components/SessionTestimonialsSection.tsx
import SessionReviews from "./SessionReviews";

export type Review = { reviewer: string; text: string; rankImg: string; champImg: string };

const REVIEWS_BY_SESSION: Record<string, Review[]> = {
  "vod-review": [
    { reviewer: "Platinum Evelynn", text: "Super clear feedback and actionable steps. Super clear feedback and actionable steps. Super clear feedback and actionable steps. ", rankImg: "/placeholder.png", champImg: "/placeholder.png" },
    { reviewer: "WHIM", text: "Hi Tim, ich habe gerade die für Donnerstag geplante Schiffstour zu Omas Geburtstag storniert. Da soll es in Miltenberg 36° werden. Das wäre nicht angenehme für uns und zu viel für Oma. Wir fahren aber am Donnerstag doch einfach hin und feiern sie ein bisschen, wahrscheinlich so um die Mittagszeit.", rankImg: "/placeholder.png", champImg: "/placeholder.png" },
    { reviewer: "Platinum Evelynn", text: "Biggest skill jump I’ve had in years!", rankImg: "/placeholder.png", champImg: "/placeholder.png" },
    { reviewer: "WHIM", text: "Sho was absolutely amazing. He explained everything very clearly and answered any questions I had better than I could have asked for. Definitely a strong recommend for anyone at any rank.", rankImg: "/placeholder.png", champImg: "/placeholder.png" },

  ],
  // other session types...
};

export default function SessionTestimonialsSection({ sessionType }: { sessionType: string }) {
  const reviews = REVIEWS_BY_SESSION[sessionType] ?? [];
  return (
    <section id="testimonials" className="mx-auto max-w-6xl px-6 pt-6 pb-10">
      <h2 className="sr-only">Testimonials</h2>
      <SessionReviews reviews={reviews} />
    </section>
  );
}
