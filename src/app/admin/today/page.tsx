import { prisma } from "@/lib/prisma";
import TodayBoard from "./TodayBoard";

function dateKey(date: Date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const now = new Date();
  const [mealPlans, studioItems, outsideMeals] = await Promise.all([
    prisma.mealPlan.findMany({
      include: { recipe: { select: { title: true } } },
      orderBy: [{ plannedDate: "asc" }, { mealSlot: "asc" }],
    }),
    prisma.socialIdea.findMany({
      where: { plannedDate: { not: null }, status: { not: "completed" } },
      select: { id: true, title: true, notes: true, plannedDate: true, plannedTime: true, platform: true, energy: true },
      orderBy: [{ plannedDate: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.outsideMeal.findMany({
      select: { id: true, name: true, date: true, mealSlot: true },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  return <TodayBoard
    initialDate={dateKey(now)}
    meals={mealPlans.map(row => ({ id: row.id, date: row.plannedDate, slot: row.mealSlot, title: row.recipe.title, status: row.status }))}
    studioItems={studioItems.filter(row => row.platform !== "appointment").map(row => ({ ...row, plannedDate: row.plannedDate! }))}
    appointments={studioItems.filter(row => row.platform === "appointment").map(row => ({ id: row.id, title: row.title, details: row.notes, date: row.plannedDate!, time: row.plannedTime ?? "" }))}
    outsideMeals={outsideMeals.map(row => ({ ...row, slot: row.mealSlot }))}
  />;
}
