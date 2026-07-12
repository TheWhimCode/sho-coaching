"use client";

import clsx from "clsx";
import { Fragment, useEffect, useState } from "react";
import GuideImage from "@/app/_components/guides/GuideImage";
import { GuideLabelWithNew } from "@/app/_components/guides/GuideNewBadge";
import GuideVideoPanel from "@/app/_components/guides/GuideVideoPanel";
import {
  renderGuideHighlightedText,
  renderGuideHighlightedTextWithViegoAbilities,
} from "@/app/_components/guides/guideTextHighlights";
import type { GuideViegoAbilityIcons } from "@/lib/guides/comboGuideTypes";
import { champSquareUrlById, resolveChampionId } from "@/lib/datadragon/champions";
import { categoryHasNewContent, topicIsNew } from "@/lib/guides/guideWhatsNew";
import {
  guideInnerPanelClass,
  guideMobileFlushPanelClass,
  guideRuneOuterPanelClass,
  guideSectionHeaderPadClass,
  guideSectionSubClass,
  guideSectionTitleClass,
} from "@/lib/guides/guideTheme";
import type {
  GuideGameStageCategory,
  GuideGameStageInvaderEntry,
  GuideGameStagePageData,
  GuideGameStageTopic,
} from "@/lib/guides/gameStageGuideTypes";

const gameStageInvaderIconClass =
  "aspect-square h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#352839] ring-1 ring-[#F0ABCF]/30 sm:h-11 sm:w-11";

const GAME_STAGE_EXTERNAL_LINK_CLASS =
  "text-lg font-bold text-[#5865F2] transition hover:text-[#7289DA] sm:text-xl";

const topicChipClass =
  "shrink-0 rounded-xl border px-3.5 py-2.5 text-left text-xs font-medium leading-snug transition sm:px-4 sm:py-3 sm:text-sm";

function firstEnabledTopic(topics: GuideGameStageTopic[]) {
  return topics.find((topic) => !topic.disabled);
}

function firstEnabledTopicId(topics: GuideGameStageTopic[]) {
  return firstEnabledTopic(topics)?.id ?? "";
}

function CategoryTabs({
  categories,
  selectedId,
  onSelect,
}: {
  categories: GuideGameStageCategory[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      className="grid grid-cols-2 divide-y divide-[#F0ABCF]/12 border-b border-[#F0ABCF]/12 sm:grid-cols-4 sm:divide-x sm:divide-y-0"
      role="tablist"
      aria-label="Game stage"
    >
      {categories.map((category) => {
        const active = category.id === selectedId;
        return (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(category.id)}
            className={clsx(
              "relative flex min-h-[3.75rem] w-full items-center justify-center px-4 py-4 text-center text-base font-bold tracking-wide transition sm:min-h-[4.25rem] sm:px-5 sm:py-5 sm:text-lg",
              active
                ? "bg-[#1E1724]/80 text-[#FAD4E8] after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-[#F0ABCF]/75"
                : "bg-[#16121A]/55 text-[#F5E6D3]/48 hover:bg-[#F0ABCF]/7 hover:text-[#F5E6D3]/72"
            )}
          >
            <GuideLabelWithNew
              isNew={categoryHasNewContent(category)}
              badgeClassName="sm:text-[10px]"
            >
              {category.label}
            </GuideLabelWithNew>
          </button>
        );
      })}
    </div>
  );
}

function TopicNav({
  topics,
  selectedId,
  onSelect,
}: {
  topics: GuideGameStageTopic[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      className="flex flex-wrap gap-2 sm:flex-col"
      role="tablist"
      aria-label="Topics"
    >
      {topics.map((topic) => {
        const active = !topic.disabled && topic.id === selectedId;
        const disabled = Boolean(topic.disabled);

        return (
          <button
            key={topic.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-disabled={disabled}
            disabled={disabled}
            onClick={() => {
              if (!disabled) onSelect(topic.id);
            }}
            className={clsx(
              topicChipClass,
              "sm:w-full",
              disabled
                ? "cursor-not-allowed border-[#F5E6D3]/8 bg-[#1E1724]/30 text-[#F5E6D3]/38 opacity-45"
                : active
                  ? "border-[#F0ABCF]/40 bg-[#F0ABCF]/10 text-[#FAD4E8] ring-1 ring-inset ring-[#F0ABCF]/25"
                  : "border-[#F0ABCF]/12 bg-[#16121A]/35 text-[#F5E6D3]/52 hover:border-[#F0ABCF]/20 hover:bg-[#F0ABCF]/5 hover:text-[#F5E6D3]/75"
            )}
          >
            <GuideLabelWithNew isNew={topicIsNew(topic)} mobileBadgeAbove>
              {topic.label}
            </GuideLabelWithNew>
          </button>
        );
      })}
    </div>
  );
}

function GuideStepCallout({
  steps,
  guideTextIcons,
  viegoAbilityIcons,
}: {
  steps: NonNullable<GuideGameStageTopic["steps"]>;
  guideTextIcons: Record<string, string>;
  viegoAbilityIcons: GuideViegoAbilityIcons;
}) {
  return (
    <div className="max-w-3xl border border-[#F0ABCF]/18 bg-[#1E1724]/35 px-4 py-3">
      {steps.map((step, index) => (
        <p
          key={step.label}
          className={clsx(
            "text-base leading-[1.75] text-[#F5E6D3]/72 sm:text-lg sm:leading-[1.7]",
            index > 0 && "mt-1.5"
          )}
        >
          <span className="font-semibold text-[#F0ABCF]">{step.label}:</span>{" "}
          {renderGuideHighlightedTextWithViegoAbilities(
            step.text,
            guideTextIcons,
            viegoAbilityIcons
          )}
        </p>
      ))}
    </div>
  );
}

function invaderEntryChampions(entry: GuideGameStageInvaderEntry) {
  if (entry.champions?.length) return entry.champions;
  if (entry.champion) return [entry.champion];
  return [];
}

function GuideTopicInvaderList({
  entries,
  guideTextIcons,
}: {
  entries: GuideGameStageInvaderEntry[];
  guideTextIcons: Record<string, string>;
}) {
  return (
    <div className="mb-3 max-w-3xl sm:mb-4">
      <p className="text-base font-semibold text-[#F0ABCF] sm:text-lg">Common invaders:</p>
      <ul className="mt-2 list-none space-y-2.5 pl-4 sm:mt-2.5 sm:space-y-3 sm:pl-6">
        {entries.map((entry) => {
          const champions = invaderEntryChampions(entry);

          return (
            <li key={entry.id} className="flex items-center gap-2.5 sm:gap-3">
              {champions.length ? (
                <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                  {champions.map((champion) => (
                    <GuideImage
                      key={champion}
                      src={champSquareUrlById(resolveChampionId(champion))}
                      alt={champion}
                      loading="lazy"
                      className={gameStageInvaderIconClass}
                    />
                  ))}
                </div>
              ) : (
                <span className={clsx(gameStageInvaderIconClass, "invisible")} aria-hidden />
              )}
              <p className="min-w-0 text-base leading-[1.75] text-[#F5E6D3]/72 sm:text-lg sm:leading-[1.7]">
                {renderGuideHighlightedText(entry.label, guideTextIcons)}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function GuideTopicParagraphs({
  text,
  guideTextIcons,
  viegoAbilityIcons,
  steps,
  invaderList,
  showStepsAfterFirst,
}: {
  text: string;
  guideTextIcons: Record<string, string>;
  viegoAbilityIcons: GuideViegoAbilityIcons;
  steps?: GuideGameStageTopic["steps"];
  invaderList?: GuideGameStageTopic["invaderList"];
  showStepsAfterFirst?: boolean;
}) {
  const paragraphs = text.split(/\n\n+/).filter(Boolean);

  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <Fragment key={index}>
          <p className="max-w-3xl text-base leading-[1.9] text-[#F5E6D3]/68 sm:text-lg sm:leading-[1.85]">
            {paragraph.split("\n").map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {lineIndex > 0 ? <br /> : null}
                {renderGuideHighlightedTextWithViegoAbilities(
                  line,
                  guideTextIcons,
                  viegoAbilityIcons
                )}
              </Fragment>
            ))}
          </p>
          {showStepsAfterFirst && steps && steps.length > 0 && index === 0 ? (
            <GuideStepCallout
              steps={steps}
              guideTextIcons={guideTextIcons}
              viegoAbilityIcons={viegoAbilityIcons}
            />
          ) : null}
          {invaderList && invaderList.length > 0 && index === 0 ? (
            <GuideTopicInvaderList entries={invaderList} guideTextIcons={guideTextIcons} />
          ) : null}
        </Fragment>
      ))}
    </>
  );
}

function GuideTopicBanner({
  topic,
  quote,
  guideTextIcons,
}: {
  topic: GuideGameStageTopic;
  quote?: GuideGameStageTopic["quote"];
  guideTextIcons: Record<string, string>;
}) {
  if (!topic.bannerImageSrc) return null;

  return (
    <figure className="max-w-3xl">
      {quote ? (
        <figcaption className="mb-3 sm:mb-4">
          {quote.lead ? (
            <p className="text-base leading-relaxed text-[#F5E6D3]/58 sm:text-lg">
              {renderGuideHighlightedText(quote.lead, guideTextIcons)}
            </p>
          ) : null}
          <p
            className={clsx(
              "text-center text-base font-bold leading-relaxed text-[#FAD4E8]/86 sm:text-lg",
              quote.lead ? "mt-1" : undefined
            )}
          >
            “{quote.text}”
          </p>
        </figcaption>
      ) : null}
      <div className="relative h-36 w-full overflow-hidden rounded-xl sm:h-40 md:h-44">
        <GuideImage
          src={topic.bannerImageSrc}
          alt={topic.bannerImageAlt ?? ""}
          className="absolute inset-0 h-full w-full object-cover object-[72%_center] brightness-[0.78]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{
            background: [
              "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 30%)",
              "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 30%)",
              "linear-gradient(to right, rgba(0,0,0,0.45) 0%, transparent 24%)",
              "linear-gradient(to left, rgba(0,0,0,0.45) 0%, transparent 24%)",
            ].join(", "),
          }}
        />
      </div>
    </figure>
  );
}

function TopicVideoList({
  topic,
  videos,
}: {
  topic: GuideGameStageTopic;
  videos: NonNullable<GuideGameStageTopic["videos"]>;
}) {
  if (!videos.some((video) => video.videoSrc || video.embedUrl)) return null;

  return (
    <div className="mt-10 space-y-8 sm:mt-12 sm:space-y-10">
      {videos.map((video, index) => {
        if (!video.videoSrc && !video.embedUrl) return null;
        return (
          <div key={`${topic.id}-video-${index}`}>
            {video.label ? (
              <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#B8D8EA]/80 sm:text-xs">
                {video.label}
              </p>
            ) : null}
            <GuideVideoPanel
              videoSrc={video.videoSrc}
              posterSrc={video.posterSrc}
              embedUrl={video.embedUrl}
              title={video.label ?? topic.label}
              interactiveControls
            />
          </div>
        );
      })}
    </div>
  );
}

function TopicArticle({
  topic,
  guideTextIcons,
  viegoAbilityIcons,
}: {
  topic: GuideGameStageTopic;
  guideTextIcons: Record<string, string>;
  viegoAbilityIcons: GuideViegoAbilityIcons;
}) {
  const videos = topic.videos ?? [];
  const videosAfterBody = topic.videosAfterBody ?? [];
  const hasVideos =
    videos.some((video) => video.videoSrc || video.embedUrl) ||
    videosAfterBody.some((video) => video.videoSrc || video.embedUrl);

  return (
    <article className="min-h-[28rem] sm:min-h-[32rem]">
      <header className="border-b border-[#F0ABCF]/10 pb-6 sm:pb-8">
        <h3 className="text-xl font-bold tracking-tight text-[#FAD4E8] sm:text-2xl lg:text-[1.65rem]">
          {topic.label}
        </h3>
        {topic.summary ? (
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#FAD4E8]/72 sm:text-base">
            {renderGuideHighlightedTextWithViegoAbilities(
              topic.summary,
              guideTextIcons,
              viegoAbilityIcons
            )}
          </p>
        ) : null}
      </header>

      {topic.body.trim() || topic.steps?.length || topic.invaderList?.length ? (
        <div className="mt-6 space-y-4 sm:mt-8">
          <GuideTopicParagraphs
            text={topic.body}
            guideTextIcons={guideTextIcons}
            viegoAbilityIcons={viegoAbilityIcons}
            steps={topic.steps}
            invaderList={topic.invaderList}
            showStepsAfterFirst
          />
        </div>
      ) : null}

      {topic.externalLink ? (
        <div className="mt-6 sm:mt-8">
          <a
            href={topic.externalLink.href}
            target="_blank"
            rel="noopener noreferrer"
            className={GAME_STAGE_EXTERNAL_LINK_CLASS}
          >
            {topic.externalLink.label}
          </a>
        </div>
      ) : null}

      {topic.bodyAfterExternalLink ? (
        <div className="mt-6 space-y-4 sm:mt-8">
          <GuideTopicParagraphs
            text={topic.bodyAfterExternalLink}
            guideTextIcons={guideTextIcons}
            viegoAbilityIcons={viegoAbilityIcons}
          />
        </div>
      ) : null}

      <div className="mt-5 sm:mt-6">
        <GuideTopicBanner
          topic={topic}
          quote={topic.quote}
          guideTextIcons={guideTextIcons}
        />
      </div>

      {topic.bodyAfterBanner ? (
        <div className="mt-6 space-y-4 sm:mt-8">
          <GuideTopicParagraphs
            text={topic.bodyAfterBanner}
            guideTextIcons={guideTextIcons}
            viegoAbilityIcons={viegoAbilityIcons}
          />
        </div>
      ) : null}

      {hasVideos ? <TopicVideoList topic={topic} videos={videos} /> : null}

      {topic.bodyBetweenVideos ? (
        <div className="mt-6 space-y-4 sm:mt-8">
          <GuideTopicParagraphs
            text={topic.bodyBetweenVideos}
            guideTextIcons={guideTextIcons}
            viegoAbilityIcons={viegoAbilityIcons}
          />
        </div>
      ) : null}

      {videosAfterBody.length > 0 ? (
        <TopicVideoList topic={topic} videos={videosAfterBody} />
      ) : null}

      {topic.bodyAfterVideos ? (
        <div className="mt-6 space-y-4 sm:mt-8">
          <GuideTopicParagraphs
            text={topic.bodyAfterVideos}
            guideTextIcons={guideTextIcons}
            viegoAbilityIcons={viegoAbilityIcons}
          />
        </div>
      ) : null}
    </article>
  );
}

export default function GameStagesSection({
  data,
  guideTextIcons = {},
  viegoAbilityIcons,
}: {
  data: GuideGameStagePageData;
  guideTextIcons?: Record<string, string>;
  viegoAbilityIcons: GuideViegoAbilityIcons;
}) {
  const [categoryId, setCategoryId] = useState(data.categories[0]?.id ?? "");
  const category =
    data.categories.find((entry) => entry.id === categoryId) ?? data.categories[0];
  const [topicId, setTopicId] = useState(
    () => firstEnabledTopicId(category?.topics ?? [])
  );

  useEffect(() => {
    const nextCategory =
      data.categories.find((entry) => entry.id === categoryId) ?? data.categories[0];
    const currentTopic = nextCategory?.topics.find((topic) => topic.id === topicId);

    if (!currentTopic || currentTopic.disabled) {
      setTopicId(firstEnabledTopicId(nextCategory?.topics ?? []));
    }
  }, [categoryId, data.categories, topicId]);

  const topic =
    category?.topics.find((entry) => entry.id === topicId && !entry.disabled) ??
    firstEnabledTopic(category?.topics ?? []);

  if (!category) return null;

  return (
    <section
      id="game-stages"
      className="scroll-mt-24 w-full min-w-0 max-w-full overflow-x-hidden sm:overflow-visible"
    >
      <div className={clsx("mb-6", guideSectionHeaderPadClass)}>
        <h2 className={guideSectionTitleClass}>{data.heading}</h2>
        {data.subtitle ? (
          <p className={guideSectionSubClass}>{data.subtitle}</p>
        ) : null}
      </div>

      <div className={clsx(guideRuneOuterPanelClass, guideMobileFlushPanelClass, "overflow-hidden p-0 sm:p-0")}>
        <CategoryTabs
          categories={data.categories}
          selectedId={category.id}
          onSelect={setCategoryId}
        />
        {category.subtitle ? (
          <div className="hidden border-b border-[#F0ABCF]/10 bg-[#16121A]/35 px-6 py-4 sm:block sm:px-8 sm:py-5">
            <p className="max-w-3xl text-sm leading-relaxed text-[#FAD4E8]/72 sm:text-base">
              {category.subtitle}
            </p>
          </div>
        ) : null}

        <div className={clsx(guideInnerPanelClass, "max-sm:!border-0 max-sm:!bg-transparent max-sm:!p-0 sm:!rounded-none sm:!border-0 sm:!bg-transparent sm:!p-0")}>
          <div className="flex flex-col gap-0 lg:flex-row lg:items-start">
            <aside className="max-sm:px-6 max-sm:py-5 border-b border-[#F0ABCF]/10 sm:py-5 sm:pl-4 sm:pr-6 lg:sticky lg:top-24 lg:w-[min(100%,13rem)] lg:shrink-0 lg:border-b-0 lg:border-r lg:py-8 lg:pl-4 lg:pr-8 xl:w-52">
              <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#B8D8EA]/80 sm:text-xs">
                Topics
              </p>
              <TopicNav
                topics={category.topics}
                selectedId={topic?.id ?? ""}
                onSelect={setTopicId}
              />
            </aside>

            <div className="min-w-0 flex-1 px-6 pb-4 pt-4 sm:p-6 lg:py-8 lg:pl-8 lg:pr-4">
              {topic ? (
                <TopicArticle
                  topic={topic}
                  guideTextIcons={guideTextIcons}
                  viegoAbilityIcons={viegoAbilityIcons}
                />
              ) : (
                <p className="text-sm text-[#F5E6D3]/48 sm:text-base">
                  More topics coming soon.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
