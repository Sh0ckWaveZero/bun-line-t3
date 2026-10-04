interface CronFieldMatchOptions {
  min: number;
  max: number;
}

interface LocalDateParts {
  minute: number;
  hour: number;
  dayOfMonth: number;
  month: number;
  dayOfWeek: number;
}

interface ParsedCronExpression {
  minute: Set<number>;
  hour: Set<number>;
  dayOfMonth: Set<number>;
  month: Set<number>;
  dayOfWeek: Set<number>;
}

const BANGKOK_OFFSET_MINUTES = 7 * 60;
const MINUTES_IN_YEAR = 366 * 24 * 60;

function parseCronField(
  field: string,
  { min, max }: CronFieldMatchOptions,
): Set<number> | null {
  const values = new Set<number>();

  for (const rawPart of field.split(",")) {
    const [rangePart, stepPart] = rawPart.split("/");
    const step = stepPart ? Number.parseInt(stepPart, 10) : 1;

    if (!Number.isInteger(step) || step < 1) return null;

    let rangeStart = min;
    let rangeEnd = max;

    if (rangePart !== "*") {
      const [startText, endText] = (rangePart ?? "").split("-");
      rangeStart = Number.parseInt(startText ?? "", 10);
      rangeEnd = endText ? Number.parseInt(endText, 10) : rangeStart;
    }

    if (
      !Number.isInteger(rangeStart) ||
      !Number.isInteger(rangeEnd) ||
      rangeStart < min ||
      rangeEnd > max ||
      rangeStart > rangeEnd
    ) {
      return null;
    }

    for (let value = rangeStart; value <= rangeEnd; value += step) {
      values.add(value);
    }
  }

  return values;
}

function parseCronExpression(expression: string) {
  const [minute, hour, dayOfMonth, month, dayOfWeek] = expression
    .trim()
    .split(/\s+/);

  if (!minute || !hour || !dayOfMonth || !month || !dayOfWeek) return null;

  const parsed = {
    minute: parseCronField(minute, { min: 0, max: 59 }),
    hour: parseCronField(hour, { min: 0, max: 23 }),
    dayOfMonth: parseCronField(dayOfMonth, { min: 1, max: 31 }),
    month: parseCronField(month, { min: 1, max: 12 }),
    dayOfWeek: parseCronField(dayOfWeek, { min: 0, max: 7 }),
  };

  if (
    !parsed.minute ||
    !parsed.hour ||
    !parsed.dayOfMonth ||
    !parsed.month ||
    !parsed.dayOfWeek
  ) {
    return null;
  }

  return parsed as ParsedCronExpression;
}

function toBangkokParts(date: Date): LocalDateParts {
  const bangkokTime = new Date(
    date.getTime() + BANGKOK_OFFSET_MINUTES * 60 * 1000,
  );

  return {
    minute: bangkokTime.getUTCMinutes(),
    hour: bangkokTime.getUTCHours(),
    dayOfMonth: bangkokTime.getUTCDate(),
    month: bangkokTime.getUTCMonth() + 1,
    dayOfWeek: bangkokTime.getUTCDay(),
  };
}

function matchesCronField(value: number, field: Set<number>): boolean {
  return field.has(value) || (value === 0 && field.has(7));
}

function matchesCronDate(
  parts: LocalDateParts,
  parsed: ParsedCronExpression,
): boolean {
  const matchesDayOfMonth = matchesCronField(
    parts.dayOfMonth,
    parsed.dayOfMonth,
  );
  const matchesDayOfWeek = matchesCronField(parts.dayOfWeek, parsed.dayOfWeek);
  const dayOfMonthIsWildcard = parsed.dayOfMonth.size === 31;
  const dayOfWeekIsWildcard = parsed.dayOfWeek.size === 8;
  const dayMatches =
    dayOfMonthIsWildcard || dayOfWeekIsWildcard
      ? matchesDayOfMonth && matchesDayOfWeek
      : matchesDayOfMonth || matchesDayOfWeek;

  return (
    matchesCronField(parts.minute, parsed.minute) &&
    matchesCronField(parts.hour, parsed.hour) &&
    matchesCronField(parts.month, parsed.month) &&
    dayMatches
  );
}

export function isValidCronExpression(expression: string): boolean {
  return parseCronExpression(expression) !== null;
}

export function matchesCronOccurrence(expression: string, date: Date): boolean {
  const parsed = parseCronExpression(expression);
  if (!parsed || date.getUTCSeconds() !== 0) return false;

  return matchesCronDate(toBangkokParts(date), parsed);
}

export function getNextCronOccurrence(
  expression: string,
  from: Date,
): Date | null {
  const parsed = parseCronExpression(expression);
  if (!parsed) return null;

  const candidate = new Date(from);
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  for (let index = 0; index < MINUTES_IN_YEAR; index += 1) {
    if (matchesCronDate(toBangkokParts(candidate), parsed)) return candidate;
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
  }

  return null;
}

export function formatCronDate(date: Date): string {
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatRelativeUntil(nextRun: Date, now: Date): string {
  const minutes = Math.max(
    1,
    Math.round((nextRun.getTime() - now.getTime()) / (60 * 1000)),
  );

  if (minutes < 60) return `อีก ${minutes} นาที`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0
    ? `อีก ${hours} ชม.`
    : `อีก ${hours} ชม. ${remainingMinutes} นาที`;
}

export function formatRelativePast(startedAt: Date, now: Date): string {
  const minutes = Math.max(
    0,
    Math.floor((now.getTime() - startedAt.getTime()) / (60 * 1000)),
  );

  if (minutes < 1) return "เมื่อสักครู่";
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชม.ที่แล้ว`;
  return `${Math.floor(hours / 24)} วันที่แล้ว`;
}
