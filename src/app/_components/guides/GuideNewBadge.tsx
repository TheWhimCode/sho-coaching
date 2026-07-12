import clsx from "clsx";
import type { ReactNode } from "react";

export default function GuideNewBadge({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        "font-medium leading-none text-[#F0ABCF] text-[8px] sm:text-[9px]",
        className
      )}
    >
      New
    </span>
  );
}

export function GuideLabelWithNew({
  children,
  isNew,
  badgeClassName,
  mobileBadgeAbove = false,
}: {
  children: ReactNode;
  isNew?: boolean;
  badgeClassName?: string;
  mobileBadgeAbove?: boolean;
}) {
  if (mobileBadgeAbove) {
    return (
      <span className="relative block w-full max-w-full sm:inline-block sm:w-auto sm:align-top">
        {children}
        {isNew ? (
          <>
            <GuideNewBadge
              className={clsx(
                "pointer-events-none absolute left-1/2 top-0.5 -translate-x-1/2 -translate-y-full whitespace-nowrap sm:hidden",
                badgeClassName
              )}
            />
            <GuideNewBadge
              className={clsx(
                "pointer-events-none absolute left-full top-1/2 ml-1 hidden -translate-y-[70%] whitespace-nowrap sm:inline",
                badgeClassName
              )}
            />
          </>
        ) : null}
      </span>
    );
  }

  return (
    <span className="relative inline-block max-w-full align-top">
      {children}
      {isNew ? (
        <GuideNewBadge
          className={clsx(
            "pointer-events-none absolute left-full top-1/2 ml-1 -translate-y-[70%] whitespace-nowrap",
            badgeClassName
          )}
        />
      ) : null}
    </span>
  );
}
