export interface TimestampResult {
  readonly ok: true;
  readonly epochSeconds: number;
  readonly epochMillis: number;
  readonly iso: string;
  readonly utc: string;
  readonly local: string;
  readonly dayOfWeek: string;
  readonly dayOfYear: number;
  readonly weekOfYear: number;
}

export interface TimestampFailure {
  readonly ok: false;
  readonly error: { message: string; hint: string };
}

export type TimestampError = {
  readonly message: string;
  readonly hint: string;
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function fromUnix(input: string, unit: 'seconds' | 'millis'): TimestampResult | TimestampFailure {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: { message: 'Input is empty.', hint: 'Enter a Unix timestamp (seconds or milliseconds).' } };
  }
  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric)) {
    return { ok: false, error: { message: 'Not a number.', hint: 'Use a numeric timestamp, e.g. 1700000000.' } };
  }
  const millis = unit === 'seconds' ? numeric * 1000 : numeric;
  const date = new Date(millis);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: { message: 'Timestamp is out of range.', hint: 'Use a value within the safe JavaScript date range.' } };
  }
  return buildResult(millis);
}

export function fromDate(input: string): TimestampResult | TimestampFailure {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: { message: 'Input is empty.', hint: 'Enter an ISO 8601 date or a year-month-day string.' } };
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: { message: 'Unrecognized date.', hint: 'Use ISO 8601 format like 2026-08-07T12:00:00Z, or yyyy-mm-dd.' } };
  }
  return buildResult(date.getTime());
}

export function toIso(millis: number): string {
  return new Date(millis).toISOString();
}

function buildResult(millis: number): TimestampResult {
  const date = new Date(millis);
  const seconds = Math.floor(millis / 1000);
  const dayOfWeek = DAYS[date.getUTCDay()] ?? '?';
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((millis - startOfYear) / 86_400_000);
  const weekOfYear = Math.ceil(((dayOfYear + 1) / 7));
  return {
    ok: true,
    epochSeconds: seconds,
    epochMillis: millis,
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toString(),
    dayOfWeek,
    dayOfYear,
    weekOfYear,
  };
}
