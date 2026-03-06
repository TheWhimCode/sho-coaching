import SkillcheckRail from "./SkillcheckRail";
import { SkillcheckBackgroundProvider } from "./layout/SkillcheckBackgroundContext";
import {
  getDailyBackgroundPathForRegion,
  ymdUTC,
} from "@/lib/skillcheck/dailyBackground";
import { getChampionRegion } from "@/lib/datadragon/championRegions";
import { getCooldownsDailyChampion } from "@/lib/skillcheck/cooldownsDailyChampion";

export default async function SkillcheckLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dayKey =
    process.env.SKILLCHECK_BACKGROUND_PER_RELOAD === "true"
      ? String(Date.now())
      : ymdUTC(new Date());

  const cooldownsChamp = getCooldownsDailyChampion(dayKey);
  const region = getChampionRegion(cooldownsChamp);

  const dailyBackgroundPath = await getDailyBackgroundPathForRegion(
    region ?? "Runeterra",
    dayKey
  );

  return (
    <SkillcheckBackgroundProvider dailyBackgroundPath={dailyBackgroundPath}>
      {/* Left-edge rail: expand on hover — games + streak */}
      <SkillcheckRail />

      {/* Ambient page background */}
      <div
        aria-hidden
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 22% 70%, rgba(0,130,255,0.22), transparent 58%), radial-gradient(circle at 78% 80%, rgba(255,100,30,0.18), transparent 58%)",
        }}
      />

      {/* Actual page content */}
      <div className="relative z-10">{children}</div>
    </SkillcheckBackgroundProvider>
  );
}
