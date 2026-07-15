import { COACHING_SALES_ENABLED } from "@/lib/coaching/coachingSales";
import { redirect } from "next/navigation";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  if (!COACHING_SALES_ENABLED) {
    redirect("/");
  }

  return children;
}
