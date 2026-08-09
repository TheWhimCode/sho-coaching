"use client";

import LinkTreeBackground from "./LinkTreeBackground";
import LinkTreeButton from "./LinkTreeButton";
import AboutMinoButton from "./AboutMinoButton";
import { LINK_TREE_LINKS } from "./linkTreeLinks";
import { LINKTREE_LIST, LINKTREE_PAGE_INNER } from "./linktreeUi";

export default function LinkTreePage() {
  const visibleLinks = LINK_TREE_LINKS.filter((link) => !link.hidden);
  const coachingLink = visibleLinks.find((link) => link.id === "coaching");
  const linksBeforeAbout = visibleLinks.filter((link) => link.id !== "coaching");

  return (
    <section className="relative isolate min-h-[100svh] w-full overflow-x-hidden text-white vignette">
      <LinkTreeBackground />

      <div className={LINKTREE_PAGE_INNER}>
        <ul className={LINKTREE_LIST}>
          {linksBeforeAbout.map((link, i) => (
            <LinkTreeButton key={link.id} link={link} index={i} />
          ))}
          <AboutMinoButton index={linksBeforeAbout.length} />
          {coachingLink ? (
            <LinkTreeButton
              link={coachingLink}
              index={linksBeforeAbout.length + 1}
            />
          ) : null}
        </ul>
      </div>
    </section>
  );
}
