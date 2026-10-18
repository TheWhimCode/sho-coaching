import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// Only public champion ratings are cached; never student/admin records.
export const pickerProfiles = unstable_cache(
  () => prisma.championProfile.findMany({ orderBy: { name: "asc" } }),
  ["picker-champion-profiles-v1"], { revalidate: 60 },
);
