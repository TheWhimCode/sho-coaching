import type { Metadata } from "next";
import WorkoutPlan from "./WorkoutPlan";

export const metadata: Metadata = { title: "Workout" };

export default function WorkoutPage() {
  return <WorkoutPlan />;
}
