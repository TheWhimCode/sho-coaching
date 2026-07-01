const SKILLCHECK_MEDIA_CDN = "https://videos.its-mino.com/skillcheck";

/** Background image on Cloudflare (path relative to `public/skillcheck/`, e.g. `demacia/foo.jpg`). */
export function skillcheckBackgroundUrl(relativePath: string) {
  const encoded = relativePath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${SKILLCHECK_MEDIA_CDN}/${encoded}`;
}
