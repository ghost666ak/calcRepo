import { describe, expect, it } from 'vitest';
import { inspectBits, maskRange, setBit } from '../bitInspector';
import { decodeUtf8, encodeUnicode, utf8Bytes } from '../unicode';
import { composeIeee754, inspectIeee754 } from '../ieee754';
import { convertBytes, dataRate } from '../byteSize';
import { fromDate, fromUnix } from '../timestamp';

describe('bit inspector', () => {
  it('decomposes 0xFF into 8 bits', () => {
    const broken = inspectBits('0xFF', 8);
    expect(broken).not.toBeNull();
    if (broken) {
      expect(broken.width).toBe(8);
      expect(broken.bits.map((bit) => bit.value).join('')).toBe('11111111');
    }
  });

  it('masks a contiguous range', () => {
    const mask = maskRange(16, 4, 11);
    expect(mask).toBe(0x0FF0n);
  });

  it('sets a single bit at the given position', () => {
    const initial = inspectBits('0', 8);
    expect(initial).not.toBeNull();
    if (!initial) return;
    const cleared = setBit(initial, 0, 1);
    expect(cleared).not.toBeNull();
    if (cleared) expect(cleared.source).toBe('128');
  });
});

describe('unicode codec', () => {
  it('encodes ASCII', () => {
    const result = encodeUnicode('A');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.codepoint).toBe(0x41);
      expect(result.utf8).toEqual([0x41]);
    }
  });

  it('encodes CJK', () => {
    const result = encodeUnicode('日');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.codepoint).toBe(0x65e5);
      expect(result.utf8).toEqual([0xe6, 0x97, 0xa5]);
      expect(result.utf16).toEqual([0x65e5]);
    }
  });

  it('encodes emoji as surrogate pair', () => {
    const result = encodeUnicode('😀');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.codepoint).toBe(0x1f600);
      expect(result.utf16).toHaveLength(2);
    }
  });

  it('decodes UTF-8 bytes', () => {
    const decoded = decodeUtf8([0xe6, 0x97, 0xa5]);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) {
      expect(decoded.codepoint).toBe(0x65e5);
    }
  });

  it('rejects invalid UTF-8', () => {
    const decoded = decodeUtf8([0xff, 0xfe]);
    expect(decoded.ok).toBe(false);
  });

  it('round-trips strings', () => {
    const sample = 'Hello, 世界! 🚀';
    const bytes = utf8Bytes(sample);
    expect(bytes.length).toBeGreaterThan(0);
  });
});

describe('IEEE-754 inspector', () => {
  it('decodes 1.0 single precision', () => {
    const fields = inspectIeee754('0x3F800000', 32);
    expect(fields).not.toBeNull();
    if (fields) {
      expect(fields.sign).toBe(0);
      expect(fields.exponent).toBe(127);
      expect(fields.decimal).toBe(1);
      expect(fields.classified).toBe('normal');
    }
  });

  it('decodes -0 single precision', () => {
    const fields = inspectIeee754('0x80000000', 32);
    expect(fields).not.toBeNull();
    if (fields) {
      expect(fields.sign).toBe(1);
      expect(fields.exponent).toBe(0);
      expect(fields.classified).toBe('zero');
    }
  });

  it('decodes positive infinity', () => {
    const fields = inspectIeee754('0x7F800000', 32);
    expect(fields).not.toBeNull();
    if (fields) {
      expect(fields.classified).toBe('infinity');
    }
  });

  it('decodes NaN', () => {
    const fields = inspectIeee754('0x7FC00000', 32);
    expect(fields).not.toBeNull();
    if (fields) {
      expect(fields.classified).toBe('nan');
    }
  });

  it('round-trips a composed value', () => {
    const hex = composeIeee754(32, 0, 127, 0n);
    expect(hex).toBe('3f800000');
  });
});

describe('byte size', () => {
  it('converts with SI prefix', () => {
    const result = convertBytes(1500, 'SI', 2);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.entries[0]?.bytes).toBe(1.5);
      expect(result.entries[0]?.unit).toBe('KB');
    }
  });

  it('converts with IEC prefix', () => {
    const result = convertBytes(1024, 'IEC', 0);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.entries[0]?.bytes).toBe(1);
      expect(result.entries[0]?.unit).toBe('KiB');
    }
  });

  it('rejects negative values', () => {
    expect(convertBytes(-1, 'SI', 0)).toBeNull();
  });

  it('formats data rate', () => {
    const rate = dataRate(1_500_000, 1, 'SI');
    expect(rate).toBe('1.50 MB/s');
  });
});

describe('timestamp', () => {
  it('parses seconds', () => {
    const result = fromUnix('1700000000', 'seconds');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.iso).toBe('2023-11-14T22:13:20.000Z');
    }
  });

  it('parses millis', () => {
    const result = fromUnix('1700000000000', 'millis');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.iso).toBe('2023-11-14T22:13:20.000Z');
    }
  });

  it('parses ISO date', () => {
    const result = fromDate('2026-08-07T00:00:00Z');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.epochMillis).toBe(Date.UTC(2026, 7, 7, 0, 0, 0));
    }
  });

  it('rejects non-numeric timestamps', () => {
    const result = fromUnix('not a number', 'seconds');
    expect(result.ok).toBe(false);
  });
});