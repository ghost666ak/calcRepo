# Phase 6 — Coding toolbox

> **Status source of truth:** Beads feature issue `calcrepo_6d0819fe-3ps.7`. This document captures scope, semantics, and contract; do not track task status here.

## Why a separate toolbox

The expression, base, and programmer modules already cover arithmetic, base conversion, and integer bitwise operations. What they do not cover is the *adjacent* work that engineers do every day: looking at IEEE-754 bits, encoding a CJK character into UTF-8, deciding how big `1.5 GB` is in IEC, or turning `1700000000` into a human date. Phase 6 adds these as **standalone utilities** that share the same input/output patterns but never participate in arithmetic.

## Tool inventory and Beads mapping

| Tool                                | Why engineers reach for it                                | Beads child ID                     |
|-------------------------------------|-----------------------------------------------------------|------------------------------------|
| Bit inspector / mask helper         | Verify flags, build masks without leaving the calculator  | `calcrepo_6d0819fe-3ps.7.1`        |
| Unicode / UTF-8 byte viewer         | Debug encoding bugs and emoji literals                    | `calcrepo_6d0819fe-3ps.7.2`        |
| IEEE-754 float inspector (32/64)    | Inspect bit layout of floats and special values           | `calcrepo_6d0819fe-3ps.7.3`        |
| Byte-size / data-rate (SI & IEC)    | Compare storage units without arithmetic slip-ups         | `calcrepo_6d0819fe-3ps.7.4`        |
| Unix timestamp / ISO date converter | Read logs and human timestamps unambiguously              | `calcrepo_6d0819fe-3ps.7.5`        |

Each tool is delivered as an independent Beads child feature; any one can be deferred without blocking the others.

## Data contracts

Every tool returns a discriminated union so consumers can pattern-match safely:

```ts
type Result<T> = { ok: true; value: T } | { ok: false; error: { message: string; hint: string } };
```

This matches the pattern already used by base conversion and programmer evaluation. Errors are *typed*, not thrown, so the UI can render them inline without try/catch.

### Bit inspector (`core/tools/bitInspector.ts`)

- Accepts signed or unsigned integers written as decimal, `0b…`, `0o…`, `0x…`, or `base#digits` (re-using the base parser).
- Widths: 4, 8, 16, 32, 64 bits. Out-of-range widths are rejected.
- Returns an array of bits MSB-first plus a `groups` view (4-bit nibbles, grouped 4×4 for 16-bit display).
- Helpers: `setBit`, `maskRange` for building masks without arithmetic.

### Unicode codec (`core/tools/unicode.ts`)

- Inputs: literal character, `U+XXXX`, `0xXXXX`, or decimal codepoint.
- Returns UTF-8 bytes, UTF-16 code units (with surrogate pair for codepoints > 0xFFFF), and a short name (when known).
- Decoder is *fatal*: invalid UTF-8 sequences return a typed failure rather than emitting U+FFFD.

### IEEE-754 inspector (`core/tools/ieee754.ts`)

- Accepts the same literal forms as the bit inspector.
- Returns sign, exponent bits, mantissa, full binary, classification (`zero`, `subnormal`, `normal`, `infinity`, `nan`), and the decoded decimal value.
- Special values are preserved symbolically (`Infinity`, `-Infinity`, `NaN`) so the UI never prints `'NaN'` accidentally.

### Byte-size (`core/tools/byteSize.ts`)

- Accepts a non-negative integer number of bytes.
- Returns a full ladder (`B`, `KB/KiB`, `MB/MiB`, …) so users see the same value across units.
- `dataRate(bytes, seconds, system)` formats bytes-per-second using the same SI/IEC distinction.

### Timestamp (`core/tools/timestamp.ts`)

- `fromUnix(input, 'seconds' | 'millis')` and `fromDate(input)` both return epoch seconds, epoch millis, ISO (UTC), UTC, local, day-of-week, day-of-year, and week-of-year.
- Local time is rendered via the browser's `Date.toString()` and is clearly labeled.

## Privacy and runtime constraints

- All tools are **local-only**. No network calls; no analytics.
- Each tool runs in its own tab inside the `ToolsView` shell, so a Unicode conversion cannot accidentally clobber bit-inspector state.
- Inputs are bounded (bit widths capped at 64; fraction digits capped at 12; byte counts must be finite non-negative integers; timestamps must be finite). Out-of-bounds values surface typed errors rather than throwing.

## Quality gates

- Unit tests live next to each module (`src/core/tools/__tests__/tools.test.ts`) and cover:
  - ASCII, CJK, surrogate-pair Unicode round-trips.
  - IEEE-754 special values (`0`, `-0`, `Infinity`, `NaN`) at both widths.
  - Byte-size SI vs IEC conversions and data-rate formatting.
  - Timestamp parsing across seconds and millis, plus ISO input.
- Component test (`tests/unit/tools-view.test.tsx`) covers tab navigation and that each tool panel renders.
- Lint, strict typecheck, full Vitest suite (106 tests across 15 files), and `npm run build` must all pass at handoff.

## Verification checklist

- [x] Each tool returns a discriminated union with typed `error`.
- [x] Invalid inputs never throw; they surface a user-facing message.
- [x] Bit inspector reuses the base literal parser so `2#1010` works.
- [x] IEEE-754 inspector handles `0`, `-0`, `±Infinity`, and `NaN` correctly.
- [x] Byte-size uses SI base 1000 and IEC base 1024; both ladders are returned.
- [x] Timestamp displays ISO, UTC, and local side-by-side.
- [x] ToolsView tab navigation works with keyboard activation.
- [x] `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` all pass.
