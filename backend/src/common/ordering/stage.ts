import { OrderingStage as StoredStage } from "@prisma/client";

export type OrderingStage = StoredStage | "dinner";

export const DEFAULT_TIMEZONE = "Asia/Kuala_Lumpur";

/** How far the zone is ahead of UTC at the given instant, in ms. */
function zoneOffset(at: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  return (
    Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour"),
      get("minute"),
      get("second"),
    ) - at
  );
}

/**
 * Admin settings store wall-clock times ("2026-11-01T19:30") meaning that
 * time in the event's zone, not in whichever zone the server runs.
 */
export function parseEventTime(value: string, timeZone: string): Date | null {
  const raw = value.trim();
  if (!raw) return null;
  if (/(Z|[+-]\d{2}:?\d{2})$/i.test(raw)) {
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(raw);
  if (!m) return null;
  const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0));
  let zone = timeZone;
  try {
    zoneOffset(wall, zone);
  } catch {
    zone = DEFAULT_TIMEZONE;
  }
  return new Date(wall - zoneOffset(wall, zone));
}

export function effectiveStage(
  stored: StoredStage,
  times: {
    deadline: Date | null;
    autoConfirm: boolean;
    dinnerTime: Date | null;
    now?: Date;
  },
): OrderingStage {
  if (stored === "closed" || stored === "finalized") return stored;

  const now = times.now ?? new Date();
  if (times.dinnerTime && now >= times.dinnerTime) return "dinner";
  if (stored === "confirmed") return "confirmed";
  if (times.autoConfirm && times.deadline && now >= times.deadline) {
    return "confirmed";
  }
  return "open";
}
