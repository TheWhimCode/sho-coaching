/** `EUW1_1234567890` or a bare game id. Stray whitespace is ignored. */
const MATCH_ID_PREFIXED = /^([A-Za-z0-9]+)_(\d+)$/;

function matchGameDigits(raw: string): string | null {
  const cleaned = raw.trim().replace(/\s+/g, "");
  if (!cleaned) return null;
  if (/^\d+$/.test(cleaned)) return cleaned;
  return MATCH_ID_PREFIXED.exec(cleaned)?.[2] ?? null;
}

/**
 * Turn a pasted match-history value into a match-v5 id.
 * A selected platform (euw1, na1, …) replaces or supplies the region tag.
 * `auto` keeps a fully prefixed id as typed, and rejects digits-only input.
 */
export function composeMatchId(raw: string, platformInput?: string): string | null {
  const digits = matchGameDigits(raw);
  if (!digits) return null;
  const hint = (platformInput ?? "").trim().toLowerCase();
  if (hint && hint !== "auto") {
    if (!/^[a-z][a-z0-9]*$/.test(hint)) return null;
    return `${hint.toUpperCase()}_${digits}`;
  }
  const prefixed = MATCH_ID_PREFIXED.exec(raw.trim().replace(/\s+/g, ""));
  if (!prefixed) return null;
  return `${prefixed[1].toUpperCase()}_${digits}`;
}
