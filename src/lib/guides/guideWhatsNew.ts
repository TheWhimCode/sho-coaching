import type { GuideGameStagePageData } from "./gameStageGuideTypes";
import type {
  GuideGameStageCategory,
  GuideGameStageTopic,
} from "./gameStageGuideTypes";
import type { GuideJungleTierMatchupPageData } from "./matchupGuideTypes";

export function topicIsNew(topic: GuideGameStageTopic) {
  return Boolean(topic.isNew && !topic.disabled);
}

export function categoryHasNewContent(category: GuideGameStageCategory) {
  return Boolean(category.isNew || category.topics.some(topicIsNew));
}

export function gameStagesSectionHasNew(data: GuideGameStagePageData) {
  return data.categories.some(categoryHasNewContent);
}

export function jungleMatchupsSectionHasNew(data: GuideJungleTierMatchupPageData) {
  return data.tiers.some((tier) => tier.matchups.some((matchup) => matchup.isNew));
}
