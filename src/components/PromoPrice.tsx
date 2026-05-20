"use client";

import { formatPriceEUR, hasPromoDiscount } from "@/engine/session";

type Props = {
  priceEUR: number;
  listPriceEUR?: number;
  discountPercent?: number;
  className?: string;
  priceClassName?: string;
  listClassName?: string;
};

const BASE_LAYOUT = "inline-flex items-baseline gap-2";

export default function PromoPrice({
  priceEUR,
  listPriceEUR = priceEUR,
  discountPercent = 0,
  className = "",
  priceClassName = "",
  listClassName = "text-[14px] font-semibold line-through leading-none opacity-60",
}: Props) {
  const showList = listPriceEUR > priceEUR + 0.001;
  const showPromo =
    showList && (hasPromoDiscount() ? discountPercent > 0 : true);

  const wrapClass = [BASE_LAYOUT, className].filter(Boolean).join(" ");

  if (!showPromo) {
    return (
      <span className={[wrapClass, priceClassName].filter(Boolean).join(" ")}>
        €{formatPriceEUR(priceEUR)}
      </span>
    );
  }

  return (
    <span className={wrapClass}>
      <span className={priceClassName}>€{formatPriceEUR(priceEUR)}</span>
      <span className={listClassName}>€{formatPriceEUR(listPriceEUR)}</span>
    </span>
  );
}
