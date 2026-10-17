export type RepeatFrequency = "none" | "weekly" | "biweekly" | "monthly";

// The longest a series can run. Weekly for 52 weeks is 53 events including the first.
export const MAX_REPEAT_WEEKS = 52;

// Firestore batches hold 500 writes; this keeps a series well under that.
export const MAX_REPEAT_OCCURRENCES = MAX_REPEAT_WEEKS + 1;

export const REPEAT_OPTIONS: { value: RepeatFrequency; label: string }[] = [
  { value: "none", label: "Does not repeat" },
  { value: "weekly", label: "Every week" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Every month" },
];

// "Repeats every week for 4 weeks (event 1 of 5)". Empty for a single event.
export function describeSeries(opportunity: {
  repeatFrequency: string;
  repeatWeeks: number | null;
  seriesPosition: number | null;
  seriesCount: number | null;
}) {
  const option = REPEAT_OPTIONS.find(
    (candidate) => candidate.value === opportunity.repeatFrequency,
  );

  if (!option || option.value === "none" || !opportunity.repeatWeeks) {
    return "";
  }

  const weeks = `${opportunity.repeatWeeks} ${opportunity.repeatWeeks === 1 ? "week" : "weeks"}`;
  const position =
    opportunity.seriesPosition && opportunity.seriesCount
      ? ` (event ${opportunity.seriesPosition} of ${opportunity.seriesCount})`
      : "";

  return `Repeats ${option.label.toLowerCase()} for ${weeks}${position}`;
}

function parseDateKey(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return { year, month, day };
}

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// The date of the nth repeat (0 is the first event). Every date is worked out
// from the first one, so a monthly event on the 31st does not drift to the 28th.
function nthDate(
  start: { year: number; month: number; day: number },
  frequency: Exclude<RepeatFrequency, "none">,
  index: number,
) {
  if (frequency === "monthly") {
    const monthIndex = start.month - 1 + index;
    const year = start.year + Math.floor(monthIndex / 12);
    const month = (monthIndex % 12) + 1;
    const lastDay = new Date(year, month, 0).getDate();

    return toDateKey(year, month, Math.min(start.day, lastDay));
  }

  const stepDays = frequency === "weekly" ? 7 : 14;
  const date = new Date(
    start.year,
    start.month - 1,
    start.day + stepDays * index,
  );

  return toDateKey(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

// The last date of a series that runs for the given number of weeks after startDate.
// Returns "" when the weeks or the date are not valid.
export function repeatUntilForWeeks(startDate: string, weeks: number) {
  const start = parseDateKey(startDate);

  if (
    !start ||
    !Number.isInteger(weeks) ||
    weeks < 1 ||
    weeks > MAX_REPEAT_WEEKS
  ) {
    return "";
  }

  const date = new Date(start.year, start.month - 1, start.day + weeks * 7);

  return toDateKey(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

// All the dates in a series, from startDate up to and including repeatUntil.
// Returns just [startDate] when the event does not repeat. Returns null when the
// dates are invalid or the series would be longer than MAX_REPEAT_OCCURRENCES.
export function occurrenceDates(
  startDate: string,
  frequency: RepeatFrequency,
  repeatUntil: string,
) {
  const start = parseDateKey(startDate);

  if (!start) {
    return null;
  }

  if (frequency === "none") {
    return [startDate];
  }

  if (!parseDateKey(repeatUntil) || repeatUntil < startDate) {
    return null;
  }

  const dates: string[] = [];

  for (let index = 0; ; index += 1) {
    const date = nthDate(start, frequency, index);

    if (date > repeatUntil) {
      return dates;
    }

    if (dates.length >= MAX_REPEAT_OCCURRENCES) {
      return null;
    }

    dates.push(date);
  }
}
