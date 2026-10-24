import type { ChampionProfile } from "@prisma/client";
import profiles from "@/data/guide/champion-profiles.json";

export type PublishedChampionProfile = Omit<ChampionProfile, "updatedAt">;

// JSON string fields are narrowed to the existing scoring enum types.
const publishedProfiles: PublishedChampionProfile[] = profiles as PublishedChampionProfile[];

/** File-backed in every environment, including cold starts and regeneration. */
export async function pickerProfiles(): Promise<PublishedChampionProfile[]> {
  return publishedProfiles;
}
