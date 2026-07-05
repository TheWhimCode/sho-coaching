"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import GuideVideoPanel from "@/app/_components/guides/GuideVideoPanel";
import { renderGuideHighlightedText } from "@/app/_components/guides/guideTextHighlights";
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
  GuideGameStagePageData,
  GuideGameStageTopic,
} from "@/lib/guides/gameStageGuideTypes";

const topicChipClass =
  "shrink-0 rounded-xl border px-3.5 py-2.5 text-left text-xs font-medium leading-snug transition sm:px-4 sm:py-3 sm:text-sm";

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
            {category.label}
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
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-none sm:flex-col sm:overflow-visible sm:pb-0"
      role="tablist"
      aria-label="Topics"
    >
      {topics.map((topic) => {
        const active = topic.id === selectedId;
        return (
          <button
            key={topic.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(topic.id)}
            className={clsx(
              topicChipClass,
              "sm:w-full",
              active
                ? "border-[#F0ABCF]/40 bg-[#F0ABCF]/10 text-[#FAD4E8] ring-1 ring-inset ring-[#F0ABCF]/25"
                : "border-[#F0ABCF]/12 bg-[#16121A]/35 text-[#F5E6D3]/52 hover:border-[#F0ABCF]/20 hover:bg-[#F0ABCF]/5 hover:text-[#F5E6D3]/75"
            )}
          >
            {topic.label}
          </button>
        );
      })}
    </div>
  );
}

function TopicArticle({
  topic,
  guideTextIcons,
}: {
  topic: GuideGameStageTopic;
  guideTextIcons: Record<string, string>;
}) {
  const paragraphs = topic.body.split(/\n\n+/).filter(Boolean);
  const videos = topic.videos ?? [];
  const hasVideos = videos.some((video) => video.videoSrc || video.embedUrl);

  return (
    <article className="min-h-[28rem] sm:min-h-[32rem]">
      <header className="border-b border-[#F0ABCF]/10 pb-6 sm:pb-8">
        <h3 className="text-xl font-bold tracking-tight text-[#FAD4E8] sm:text-2xl lg:text-[1.65rem]">
          {topic.label}
        </h3>
        {topic.summary ? (
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#FAD4E8]/72 sm:text-base">
            {renderGuideHighlightedText(topic.summary, guideTextIcons)}
          </p>
        ) : null}
      </header>

      <div className="mt-6 space-y-5 sm:mt-8 sm:space-y-6">
        {paragraphs.map((paragraph, index) => (
          <p
            key={index}
            className="max-w-3xl text-base leading-[1.9] text-[#F5E6D3]/68 sm:text-lg sm:leading-[1.85]"
          >
            {renderGuideHighlightedText(paragraph, guideTextIcons)}
          </p>
        ))}
      </div>

      {hasVideos ? (
        <div className="mt-10 space-y-8 border-t border-[#F0ABCF]/10 pt-8 sm:mt-12 sm:space-y-10 sm:pt-10">
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
                />
              </div>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}

export default function GameStagesSection({
  data,
  guideTextIcons = {},
}: {
  data: GuideGameStagePageData;
  guideTextIcons?: Record<string, string>;
}) {
  const [categoryId, setCategoryId] = useState(data.categories[0]?.id ?? "");
  const category =
    data.categories.find((entry) => entry.id === categoryId) ?? data.categories[0];
  const [topicId, setTopicId] = useState(category?.topics[0]?.id ?? "");

  useEffect(() => {
    const nextCategory =
      data.categories.find((entry) => entry.id === categoryId) ?? data.categories[0];
    if (!nextCategory?.topics.some((topic) => topic.id === topicId)) {
      setTopicId(nextCategory?.topics[0]?.id ?? "");
    }
  }, [categoryId, data.categories, topicId]);

  const topic =
    category?.topics.find((entry) => entry.id === topicId) ?? category?.topics[0];

  if (!category || !topic) return null;

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
          <div className="border-b border-[#F0ABCF]/10 bg-[#16121A]/35 px-6 py-4 sm:px-8 sm:py-5">
            <p className="max-w-3xl text-sm leading-relaxed text-[#FAD4E8]/72 sm:text-base">
              {category.subtitle}
            </p>
          </div>
        ) : null}

        <div className={clsx(guideInnerPanelClass, "max-sm:!border-0 max-sm:!bg-transparent max-sm:!p-0 sm:!rounded-none sm:!border-0 sm:!bg-transparent sm:!p-0")}>
          <div className="flex flex-col gap-0 lg:flex-row lg:items-start">
            <aside className="border-b border-[#F0ABCF]/10 px-6 py-5 sm:px-8 lg:sticky lg:top-24 lg:w-[min(100%,17rem)] lg:shrink-0 lg:border-b-0 lg:border-r lg:py-8 lg:pl-8 lg:pr-6 xl:w-72">
              <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#B8D8EA]/80 sm:text-xs">
                Topics
              </p>
              <TopicNav
                topics={category.topics}
                selectedId={topic.id}
                onSelect={setTopicId}
              />
            </aside>

            <div className="min-w-0 flex-1 px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10 xl:px-12 xl:py-12">
              <TopicArticle topic={topic} guideTextIcons={guideTextIcons} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
