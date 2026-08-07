# Phase 5 — Programmer calculator and direct mixed-base expressions

> **Status source of truth:** Beads feature `calcrepo_6d0819fe-3ps.6` with child tasks `.6.1`, `.6.2`, `.6.3`.

## Goal

Combine the expression engine and base engine into a coding-focused calculator where the user can write expressions like `16#FF + 2#1010` directly without manual conversion. Provide bitwise operators, configurable word width, signedness, and synchronized base panels.

## Deliverables

- `BigInt`-based integer representation with width masking (8/16/32/64) and signed/unsigned reinterpretation.
- Bitwise operators: `&`, `|`, `^`, `~`, `<<`, `>>`, `<<<`, `>>>` plus modular `+`, `-`, `%`.
- Mixed-base literal parsing: `0b…`, `0o…`, `0x…`, `base#digits` for bases 2–36.
- Frac­tional operands rejected with a precise remediation message.
- Status flags: overflow, carry, invalid bits.
- `ProgrammerView` UI: expression input, configurable width/signedness, output-base selector, synchronized BIN/OCT/DEC/HEX panels, copy, accessible errors.

## File map

- `src/core/programmer/word.ts` — `ProgrammerValue`, `WordWidth`, `Signedness`, masking and bounds helpers.
- `src/core/programmer/operations.ts` — `bitwiseAnd/Or/Xor/Not`, `shiftLeft/Right`, `rotateLeft/Right`, `modularAdd/Subtract`, `integerModulo`.
- `src/core/programmer/evaluate.ts` — recursive-descent parser, AST evaluation, error reporting.
- `src/core/programmer/__tests__/operations.test.ts`, `evaluate.test.ts` — 22 unit tests.
- `src/features/programmer/useProgrammerCalculator.ts`, `ProgrammerView.tsx` — React hook + UI.
- `tests/unit/programmer-view.test.tsx` — 4 component tests.
- `src/styles/app.css` — programmer-view styling.

## Verification

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` all succeed.
- Truth-table tests cover AND/OR/XOR/NOT, shifts/rotates, modular arithmetic, overflow/carry flags.
- Mixed-base property: `16#FF + 2#1010` produces `265`.
- Boundary checks: 8-bit signed `127 + 1` → `-128` with overflow flag; 8-bit unsigned `0xFF + 1` → `0` with carry flag.
- Fractional operands rejected with a "fractional values are not allowed" message.
- `git status` reported; no commit, push, or deploy performed.