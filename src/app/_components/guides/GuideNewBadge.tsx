import clsx from "clsx";
import type { ReactNode } from "react";

export default function GuideNewBadge({ className }: { className?: string }) {
  return (
    <span className={clsx("font-medium leading-none text-[#F0ABCF]", className)}>
      New
    </span>
  );
}

export function GuideLabelWithNew({
  children,
  isNew,
  badgeClassName,
}: {
  children: ReactNode;
  isNew?: boolean;
  badgeClassName?: string;
}) {
  return (
    <span className="relative inline-block max-w-full align-top">
      {children}
      {isNew ? (
        <GuideNewBadge
          className={clsx(
            "pointer-events-none absolute left-full top-1/2 ml-1 -translate-y-[70%] whitespace-nowrap text-[9px]",
            badgeClassName
          )}
        />
      ) : null}
    </span>
  );
}
