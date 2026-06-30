"use client";

import LinkTreeBackground from "./LinkTreeBackground";
import LinkTreeButton from "./LinkTreeButton";
import AboutMinoButton from "./AboutMinoButton";
import { LINK_TREE_LINKS } from "./linkTreeLinks";
import { LINKTREE_LIST, LINKTREE_PAGE_INNER } from "./linktreeUi";

const IS_DEV = process.env.NODE_ENV === "development";

export default function LinkTreePage() {
  return (
    <section className="relative isolate min-h-[100svh] w-full overflow-x-hidden text-white vignette">
      <LinkTreeBackground />

      <div className={LINKTREE_PAGE_INNER}>
        <ul className={LINKTREE_LIST}>
          {LINK_TREE_LINKS.map((link, i) => (
            <LinkTreeButton key={link.id} link={link} index={i} />
          ))}
          {IS_DEV ? <AboutMinoButton index={LINK_TREE_LINKS.length} /> : null}
        </ul>
      </div>
    </section>
  );
}
