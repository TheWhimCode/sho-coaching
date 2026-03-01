// engine/checkout/payload/index.ts
// Parse URL / search params into Checkout Payload; transform for backend.

export {
  parseCheckoutPayload,
  deriveBaseMinutes,
  mergedMinutes,
  type SearchParamsLike,
} from "./parseCheckoutPayload";

export {
  toPayloadForBackend,
  totalLiveMinutesFromPayload,
  mergeWithDefaultPayload,
} from "./transform";
