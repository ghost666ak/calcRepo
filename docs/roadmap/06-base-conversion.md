# Phase 4 — Arbitrary-base conversion

> **Status source of truth:** Beads feature `calcrepo_6d0819fe-3ps.5` with child tasks `.5.1`, `.5.2`, `.5.3`.

## Progress

### Core engine (`calcrepo_6d0819fe-3ps.5.1`) — completed

- `src/core/base/rational.ts` — signed `BigInt` rational type with `add`/`subtract`/`multiply`/`divide`/`negate`/`compare` and always-positive denominator.
- `src/core/base/parse.ts` — `parseBaseLiteral(input, explicitBase?)` returns a typed `BaseParseResult`. Recognizes:
  - bare decimal `123`, `-1.5`, `0.1`
  - prefixes `0b`/`0o`/`0x`
  - arbitrary `base#digits` such as `36#Z` or `3#-1.1` (sign within digits)
  - errors carry `message` + `hint` for remediation.
- `src/core/base/convert.ts` — exact conversion via integer long division plus a remainder-cycle detector that flags repeating fractions with parentheses and marks truncation when `maxFractionDigits` is reached.
- `src/core/base/index.ts` — re-exports.
- Tests (14 cases) cover parse prefix/suffix variants, digit-out-of-range errors, negative fractions, integer conversion across bases 2–36, repeating-fraction detection, truncation labeling, and digit grouping. Property tests via `fast-check` exercise round-trips across 50 random base pairs, large integers (2^64, 2^100, -2^200), and identity preservation.

### Converter UI (`calcrepo_6d0819fe-3ps.5.2`) — pending

- `useBaseConverter` hook and `BaseView` mode UI with BIN/OCT/DEC/HEX presets, arbitrary source/target selectors, swap, copy, grouped digit display, and accessible errors.

### Property tests (`calcrepo_6d0819fe-3ps.5.3`) — partially delivered (integer round-trip). Fractional identities are documented to require repeating/truncation handling beyond identity preservation.

## Goal

Add an exact arbitrary-base converter: signed integers and signed fractions between bases 2 and 36, without any pass through floating-point. Surface the converter as a new mode in the calculator UI with sensible defaults for everyday use.

## Deliverables

- Exact signed rational representation (`BigInt` numerator/denominator) at `src/core/base/rational.ts`.
- Base literal parser (`2#1010`, `16#FF`, `36#Z`) at `src/core/base/parse.ts` with negative sign and decimal point support.
- Conversion engine at `src/core/base/convert.ts` (and a public `convertValue(value, from, to, options)` API).
- `useBaseConverter` hook and `BaseView` mode UI with BIN/OCT/DEC/HEX presets, arbitrary source/target selectors, swap, copy, grouped digit display, and accessible errors.
- Unit + property tests for round-trip across random bases, large integers beyond `Number.MAX_SAFE_INTEGER`, negatives, fractions, invalid digits, repeating-fraction detection and truncation labeling.

## File map

- `src/core/base/rational.ts`, `src/core/base/parse.ts`, `src/core/base/convert.ts`, `src/core/base/index.ts`.
- `src/core/base/__tests__/parse.test.ts`, `convert.test.ts`, `properties.test.ts`.
- `src/features/base/useBaseConverter.ts`, `src/features/base/BaseView.tsx`, `src/features/base/format.ts`.
- `src/styles/app.css` — base view layout.
- `tests/unit/base-view.test.tsx`.

## Verification

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` all succeed.
- Property test rounds-trip `n#value → m#value` for randomized bases 2–36 and verifies the result string parses back to the same rational.
- Manual boundary checks: `2#1111111111111111` (16-bit), `16#FFFFFFFFFFFFFFFFFFFFFFFF`, signed `-1/3`, and a 200-digit decimal.
- `git status` reported; no commit, push, or deploy performed.