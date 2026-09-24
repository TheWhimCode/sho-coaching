// Round a shortage up to the seller's pack size. No pack means buy the exact shortage.
export function purchaseQuantity(shortfallGrams: number, packGrams: number | null) {
  if (!Number.isFinite(shortfallGrams) || shortfallGrams <= 0.000001) return 0;
  const exact = Math.round(shortfallGrams * 1000) / 1000;
  if (packGrams == null || !Number.isFinite(packGrams) || packGrams <= 0) return exact;
  const packs = Math.ceil((shortfallGrams - 0.000001) / packGrams);
  return Math.round(packs * packGrams * 1000) / 1000;
}

// Shopping grams already counted toward the recipe. Raise the line only when they still fall short.
export function nextShoppingGrams(haveGrams: number, listedGrams: number, needGrams: number, packGrams: number | null) {
  const covered = haveGrams + listedGrams;
  if (covered + 0.000001 >= needGrams) return listedGrams;
  return Math.round((listedGrams + purchaseQuantity(needGrams - covered, packGrams)) * 1000) / 1000;
}
