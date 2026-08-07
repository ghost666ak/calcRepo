# Phase 2 — Basic calculator MVP

> **Status source of truth:** Beads feature `calcrepo_6d0819fe-3ps.3` with child tasks `.3.1`, `.3.2`, `.3.3`.

## Goal

Deliver the first genuinely usable calculator: arithmetic with correct precedence, parentheses, unary signs, decimals, percent, error recovery, and full keyboard parity with the on-screen keypad. No scientific features yet — those land in Phase 3.

## Deliverables

- Restricted expression evaluator at `src/core/expression/{parse,evaluate,types,errors}.ts` built on a small, hand-written recursive-descent parser (no `mathjs` yet — defer that dependency to Phase 3).
- Typed result union (`EvalResult`) shared with `src/core/types.ts`.
- Keypad wired to a basic-mode hook in `src/features/basic/{useBasicCalculator.ts,BasicView.tsx}`.
- Result copy, repeated-equals behavior, clear/backspace, session history, and keyboard map (`0-9`, `.`, `+ - * /`, `(`, `)`, `=`, `Enter`, `Backspace`, `Escape`).
- Comprehensive unit tests in `src/core/expression/__tests__/` and a Vitest hook test in `tests/unit/basic-calculator.test.tsx`.

## File map

- `src/core/expression/parse.ts`, `src/core/expression/evaluate.ts`, `src/core/expression/types.ts`, `src/core/expression/errors.ts`, `src/core/expression/index.ts`.
- `src/core/expression/__tests__/parse.test.ts`, `evaluate.test.ts`, `percent.test.ts`.
- `src/features/basic/useBasicCalculator.ts`, `src/features/basic/format.ts`, `src/features/basic/format.test.ts`, `src/features/basic/BasicView.tsx`.
- `src/components/Keypad.tsx` (extended for backspace/clear), `src/components/Display.tsx` (optional history strip).
- `src/styles/app.css` (history strip styles).
- `tests/unit/basic-calculator.test.tsx`.

## Verification

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` all succeed.
- Hook test exercises: `2+3*4 = 14`, `8/2 = 4`, `(2+3)*4 = 20`, `-5+5 = 0`, `1.5+2.5 = 4`, `50% = 0.5`, repeated equals doubling, division-by-zero recovery, syntax error hint.
- `git status` reported at handoff; no commit, push, or deploy performed.