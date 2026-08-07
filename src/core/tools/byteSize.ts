export interface ByteSizeEntry {
  readonly unit: string;
  readonly bytes: number;
  readonly system: 'SI' | 'IEC';
}

export interface ByteSizeResult {
  readonly bytes: number;
  readonly entries: readonly ByteSizeEntry[];
  readonly system: 'SI' | 'IEC';
}

const SI_UNITS: readonly string[] = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
const IEC_UNITS: readonly string[] = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB'];

export function convertBytes(bytes: number, system: 'SI' | 'IEC', fractionDigits: number): ByteSizeResult | null {
  if (!Number.isFinite(bytes) || bytes < 0) return null;
  if (!Number.isInteger(fractionDigits) || fractionDigits < 0 || fractionDigits > 12) return null;
  const base = system === 'SI' ? 1000 : 1024;
  const units = system === 'SI' ? SI_UNITS : IEC_UNITS;
  const entries: ByteSizeEntry[] = [];
  let value = bytes;
  let unitIndex = 0;
  while (value >= base && unitIndex < units.length - 1) {
    value = value / base;
    unitIndex += 1;
  }
  entries.push({ unit: units[unitIndex] ?? 'B', bytes: round(value, fractionDigits), system });
  for (let i = unitIndex + 1; i < units.length; i += 1) {
    const upper = units[i];
    if (!upper) break;
    entries.push({ unit: upper, bytes: round(value * Math.pow(base, i - unitIndex), fractionDigits), system });
  }
  return { bytes, entries, system };
}

function round(value: number, digits: number): number {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}

export function dataRate(bytes: number, seconds: number, system: 'SI' | 'IEC'): string | null {
  if (!Number.isFinite(bytes) || bytes < 0) return null;
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  const bytesPerSecond = bytes / seconds;
  const base = system === 'SI' ? 1000 : 1024;
  const units = system === 'SI' ? ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s'] : ['B/s', 'KiB/s', 'MiB/s', 'GiB/s', 'TiB/s'];
  let value = bytesPerSecond;
  let index = 0;
  while (value >= base && index < units.length - 1) {
    value = value / base;
    index += 1;
  }
  const unit = units[index] ?? 'B/s';
  return `${value.toFixed(2)} ${unit}`;
}
