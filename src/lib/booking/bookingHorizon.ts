/**
 * Client-safe booking horizon (keep in sync with CFG_SERVER.booking.MAX_ADVANCE_DAYS default).
 * Server policy also caps at end of the upcoming Saturday UTC.
 */
export const BOOKING_HORIZON_DAYS = 5;

/** Days to request from the slots API / show in the calendar (covers until Saturday). */
export const BOOKING_UI_FETCH_DAYS = 7;
