# Phase 3 — Scientific and trigonometric calculator

> **Status source of truth:** Beads feature `calcrepo_6d0819fe-3ps.4` with child tasks `.4.1`, `.4.2`, `.4.3`.

## Goal

Extend the basic engine with the scientific function allowlist, configurable precision, the trigonometric family with visible DEG/RAD/GRAD selection, and an accessible expanded UI. Keep using the same hand-written recursive-descent evaluator approach so the math semantics stay auditable; `mathjs` stays a future swap-in if needed.

## Deliverables

- Scientific function library at `src/core/scientific/functions.ts` covering powers, roots, logs, exponentials, combinatorics (`n!`, `nPr`, `nCr`), constants (`pi`, `e`), trigonometric, inverse trig, and hyperbolic families.
- Restricted scientific evaluator at `src/core/scientific/evaluate.ts` that reuses `parse.ts` tokenization, recognizes function tokens, and dispatches through an allowlist.
- Angle unit state in `src/features/scientific/{useScientificCalculator.ts,ScientificView.tsx}` with persistence through `src/state/preferences.ts`.
- `ScientificView` UI with always-visible angle selector, expandable function keypad, memory register buttons (`M+`, `M-`, `MR`, `MC`), and precision selector.
- Vitest unit tests for the scientific matrix (functions, domains, angle identities), a hook test for the view, and a small Playwright a11y smoke for the scientific mode.

## File map

- `src/core/scientific/functions.ts` — pure function allowlist with metadata.
- `src/core/scientific/evaluate.ts` — scientific evaluator that handles function calls.
- `src/core/scientific/__tests__/functions.test.ts`, `__tests__/evaluate.test.ts`.
- `src/features/scientific/{useScientificCalculator,ScientificView}.tsx`.
- `src/state/preferences.ts` — extend with `angleUnit` and `precision`.
- `src/styles/app.css` — scientific layout styles.
- `tests/unit/scientific-view.test.tsx`, `tests/e2e/scientific.spec.ts` (best-effort; will be skipped in environments without Playwright browser deps).

## Verification

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` all succeed.
- Identity matrix: `sin(0)=0`, `cos(0)=1`, `sin(pi)=0`, `cos(pi)=-1` (RAD); `sin(180)=0` (DEG); `sin(200)=0` (GRAD). Inverses round-trip within precision.
- Domain errors for `asin(2)`, `log(0)`, `sqrt(-1)`, `1/0`.
- `git status` reported; no commit, push, or deploy performed.