# Roadmap index

This directory holds the durable product and engineering specifications for the static developer calculator. **Beads (`bd`) is the source of truth for task status**; these Markdown documents describe contracts, scope, and acceptance criteria only.

## Start here

- `00-product-scope.md` — vision, audience, mode map, quality targets.
- `01-math-semantics.md` — locked-in mathematical and engineering contract.
- `02-delivery-phases.md` — phase order, deliverables, verification.

## Phase specifications

| Phase | Title                                            | Beads epic/feature          |
|-------|--------------------------------------------------|------------------------------|
| 0     | Roadmap and contracts                            | `calcrepo_6d0819fe-3ps.1`    |
| 1     | Static app foundation                            | `calcrepo_6d0819fe-3ps.2`    |
| 2     | Basic calculator MVP                             | `calcrepo_6d0819fe-3ps.3`    |
| 3     | Scientific and trigonometric modes               | `calcrepo_6d0819fe-3ps.4`    |
| 4     | Arbitrary-base conversion                        | `calcrepo_6d0819fe-3ps.5`    |
| 5     | Programmer and mixed-base calculations           | `calcrepo_6d0819fe-3ps.6`    |
| 6     | Coding toolbox utilities                         | `calcrepo_6d0819fe-3ps.7`    |
| 7     | Polish, offline support, and deployment          | `calcrepo_6d0819fe-3ps.8`    |

The `docs/roadmap/0X-*.md` files for phases 1–7 will be added at the start of each respective phase, alongside the matching feature claim.

## How to use these documents

- Read the relevant `0X-*.md` before claiming its feature in Beads.
- Treat `01-math-semantics.md` as a public contract; any change requires updating tests in the same change set.
- Run `bd ready` to discover the next unblocked phase.