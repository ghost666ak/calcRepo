# Delivery phases

> **Status source of truth:** Beads epic `calcrepo_6d0819fe-3ps` plus its numbered child features and tasks. Do not duplicate task state in this document.

Each phase has:

- An epic or feature in Beads.
- A Markdown specification (`docs/roadmap/0X-*.md`) that describes scope, contracts, work packages, and verification.
- A documented checkpoint: lint, typecheck, unit, end-to-end, and a browser run of representative flows.

Phases are sequential; a phase begins only after the prior checkpoint is accepted.

## Phase 0 — Roadmap and contracts

- Beads: `calcrepo_6d0819fe-3ps.1`
- Specifications: `00-product-scope.md`, `01-math-semantics.md`, `02-delivery-phases.md`, `README.md`
- Exit criteria: contracts are unambiguous enough to drive implementation tests; `bd lint` passes.

## Phase 1 — Static foundation

- Beads: `calcrepo_6d0819fe-3ps.2`
- Specification: `03-foundation.md`
- Exit criteria: lint, strict typecheck, test harness, production build, browser smoke checks pass.

## Phase 2 — Basic calculator MVP

- Beads: `calcrepo_6d0819fe-3ps.3`
- Specification: `04-basic-calculator.md`
- Exit criteria: representative arithmetic, error recovery, keyboard-only flow pass in the built app.

## Phase 3 — Scientific and trigonometric calculator

- Beads: `calcrepo_6d0819fe-3ps.4`
- Specification: `05-scientific-trigonometry.md`
- Exit criteria: documented scientific/trigonometric matrix and angle modes verified in the browser.

## Phase 4 — Arbitrary-base conversion

- Beads: `calcrepo_6d0819fe-3ps.5`
- Specification: `06-base-conversion.md`
- Exit criteria: randomized round trips, large values, negatives, fractions, invalid digits pass.

## Phase 5 — Programmer and mixed-base calculations

- Beads: `calcrepo_6d0819fe-3ps.6`
- Specification: `07-programmer-calculator.md`
- Exit criteria: width/signedness, overflow, bitwise, shift, and mixed-base workflows pass.

## Phase 6 — Coding toolbox

- Beads: `calcrepo_6d0819fe-3ps.7`
- Specification: `08-coding-toolbox.md`
- Exit criteria: each independent utility has fixture-driven unit and end-to-end coverage.

## Phase 7 — Polish, offline, deployment

- Beads: `calcrepo_6d0819fe-3ps.8`
- Specification: `09-release-deployment.md`
- Exit criteria: full quality gates, accessibility, bundle budgets, offline reload, and static preview smoke test pass.

## Dependency order

`calcrepo_6d0819fe-3ps.1` → `…2` → `…3` → `…4` → `…5` → `…6` → `…7` → `…8`. Encoded with `bd dep add` so `bd ready` always shows only the next unblocked phase.