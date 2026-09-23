import type { Metadata } from "next";
import StudioBoard from "./StudioBoard";

export const metadata: Metadata = { title: "Studio" };

export default function StudioPage() {
  return <StudioBoard />;
}
