import { createHash } from "node:crypto";
import { isIP } from "node:net";

export class RequestLimitError extends Error {
  constructor(public readonly retryAfter: number) {
    super("Too many requests. Please wait a moment and try again.");
    this.name = "RequestLimitError";
  }
}

export function visitorBucket(headers: Headers): string {
  const raw = headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const ip = isIP(raw) ? raw : "unknown";
  return createHash("sha256").update(ip.toLowerCase()).digest("hex").slice(0, 4);
}
