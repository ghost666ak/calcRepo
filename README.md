# calcRepo

A fully static, accessible developer calculator that grows from trustworthy basic arithmetic into scientific, trigonometric, arbitrary-base, mixed-base, programmer, and coding toolbox modes. Everything runs in the browser; no backend is required.

## Current phase

Phase 0 — Roadmap and mathematical contracts. No application code yet.

Beads is the source of truth for task status. Run `bd ready` for available work or `bd show calcrepo_6d0819fe-3ps` for the epic view.

## Roadmap

- [Product scope](docs/roadmap/00-product-scope.md)
- [Mathematical semantics](docs/roadmap/01-math-semantics.md)
- [Delivery phases](docs/roadmap/02-delivery-phases.md)
- [Roadmap index](docs/roadmap/README.md)

## Architecture in one paragraph

The build target is a static `dist/` directory: Vite + React + strict TypeScript on the front end, a restricted `mathjs` evaluator for scientific expressions, native `BigInt` for the programmer engine, and a `BigInt`-backed rational representation for arbitrary-base conversion. Vitest, `fast-check`, Playwright, and axe-core provide unit, property, end-to-end, and accessibility coverage. The full plan lives in `docs/roadmap/` and the matching Beads epic.

## Contributing

1. Read the roadmap documents and the Beads epic.
2. Claim the relevant issue with `bd update <id> --claim` before editing.
3. Update tests alongside any contract change in `01-math-semantics.md`.
4. At handoff, run lint, typecheck, tests, and the build, and report the results with `git status`.