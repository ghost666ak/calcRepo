# Product scope

> **Status source of truth:** Beads epic `calcrepo_6d0819fe-3ps` and its child issues. This document only frames the product; do not track task status here.

## Vision

A fully static, browser-based developer calculator that grows from a trustworthy basic calculator into scientific, trigonometric, arbitrary-base, mixed-base, programmer, and coding toolbox modes. Every mode must be useful on its own, work without a network connection, and remain responsive on phones as well as desktops.

## Audience

- Engineers, students, and hobbyists who want a calculator they trust for everyday arithmetic.
- Programmers and technical users who need exact integer and base-aware math, bitwise operations, and quick developer utilities.
- Casual users who only need basic arithmetic and an obvious, accessible interface.

## Mode map

| Mode             | Why it matters                                                    | First-phase dependency |
|------------------|-------------------------------------------------------------------|------------------------|
| Basic            | Trustworthy daily arithmetic with keyboard and screen reader parity | Phase 2 (`calcrepo_6d0819fe-3ps.3`) |
| Scientific       | Logs, roots, combinatorics, configurable precision                | Phase 3 (`calcrepo_6d0819fe-3ps.4`) |
| Trigonometry     | Trig and hyperbolic functions with visible DEG/RAD/GRAD selection  | Phase 3 (`calcrepo_6d0819fe-3ps.4`) |
| Base converter   | Exact conversion among bases 2–36, including fractions            | Phase 4 (`calcrepo_6d0819fe-3ps.5`) |
| Programmer       | Mixed-base integer math, bitwise, width, signedness               | Phase 5 (`calcrepo_6d0819fe-3ps.6`) |
| Coding toolbox   | Bit masks, ASCII/Unicode, IEEE-754, byte units, Unix timestamps   | Phase 6 (`calcrepo_6d0819fe-3ps.7`) |

## Quality targets

- Performance: largest contentful paint under 2.5 s on a mid-range phone once cached; initial bundle budget per mode in `09-release-deployment.md`.
- Accessibility: WCAG 2.2 AA across modes; axe-core CI scan must be clean for every phase.
- Resilience: every recoverable error is presented with a typed message and a remediation hint; the app never shows raw `NaN`.
- Determinism: scientific results within the chosen precision are stable across runs; base conversion never loses precision through a JavaScript `number`.

## MVP boundary

Phase 2 ships a basic calculator that supports the arithmetic, error recovery, and keyboard contract described in `04-basic-calculator.md`. Scientific, base conversion, programmer, and toolbox modes are deliberately deferred to later phases so each can be verified in isolation.

## Privacy

The app runs entirely in the browser. No telemetry is collected by default; opt-in history and favorites persist locally only.