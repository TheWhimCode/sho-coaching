"use client";

import LinkTreeBackground from "./LinkTreeBackground";
import LinkTreeButton from "./LinkTreeButton";
import { LINK_TREE_LINKS } from "./linkTreeLinks";

export default function LinkTreePage() {
  return (
    <section className="relative isolate overflow-x-hidden text-white vignette">
      <LinkTreeBackground />

      <div className="relative z-20 flex min-h-[100svh] flex-col items-center justify-start px-5 pt-24 pb-14 md:pt-32 md:pb-16">
        <ul className="w-full max-w-[26rem] md:max-w-md flex flex-col gap-3 md:gap-3.5 list-none p-0 m-0">
          {LINK_TREE_LINKS.map((link, i) => (
            <LinkTreeButton key={link.id} link={link} index={i} />
          ))}
        </ul>
      </div>
    </section>
  );
}
