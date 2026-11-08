const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const MONTH_MS = 30 * DAY_MS;
const YEAR_MS = 365 * DAY_MS;

const relativeTime = new Intl.RelativeTimeFormat("ru", { numeric: "always" });

const unitFor = (milliseconds: number): [Intl.RelativeTimeFormatUnit, number] => {
  if (milliseconds < HOUR_MS) return ["minute", MINUTE_MS];
  if (milliseconds < DAY_MS) return ["hour", HOUR_MS];
  if (milliseconds < MONTH_MS) return ["day", DAY_MS];
  if (milliseconds < YEAR_MS) return ["month", MONTH_MS];

  return ["year", YEAR_MS];
};

/**
 * Formats the distance between `date` and `nowMs` in Russian.
 * Pass `nowMs` explicitly to get deterministic output.
 */
export function formatDistanceToNow(date: number | Date, nowMs: number = Date.now()): string {
  const dateMs = date instanceof Date ? date.getTime() : date;
  if (Number.isNaN(dateMs) || Number.isNaN(nowMs)) {
    throw new RangeError("Invalid time value");
  }

  const difference = dateMs - nowMs;
  const distance = Math.abs(difference);

  if (distance < MINUTE_MS) {
    return difference > 0 ? "меньше, чем через минуту" : "меньше минуты";
  }

  const [unit, unitMs] = unitFor(distance);
  return relativeTime.format(Math.round(difference / unitMs), unit);
}
