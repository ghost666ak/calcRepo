# calcRepo

A fully static, accessible developer calculator that grows from trustworthy basic arithmetic into scientific, trigonometric, arbitrary-base, mixed-base, programmer, and coding toolbox modes. Everything runs in the browser; no backend is required and the app installs as an offline-capable PWA.

## Status

Phase 7 — Polish, offline support, and deployment. Beads is the source of truth for task status: run `bd ready` for available work or `bd show calcrepo_6d0819fe-3ps` for the epic view.

## Features

- **Basic**: keyboard-driven arithmetic with percent, copy, repeat, in-session history.
- **Scientific**: logs, roots, factorial/combinatorics, configurable precision, scientific notation, memory registers.
- **Trigonometry**: sin/cos/tan/inverse/hyperbolic with visible DEG/RAD/GRAD selector.
- **Base converter**: exact conversion among bases 2–36, signed values, fractions, repeating/truncation labelling.
- **Programmer**: mixed-base expressions (`16#FF + 2#1010`), bitwise operators, 8/16/32/64-bit widths, signed/unsigned two's complement, synchronized BIN/OCT/DEC/HEX panels.
- **Coding toolbox**: bit inspector/mask helper, Unicode & UTF-8 inspector, IEEE-754 float inspector (32/64), byte-size + data-rate (SI/IEC), Unix timestamp / ISO converter.
- **Persistence**: opt-in history and favorites that stay on this device.
- **Offline**: service worker + manifest so the app installs and works without a network.

## Quick start

```bash
npm install
npm run dev       # Vite dev server at http://localhost:5173
npm test          # Vitest unit/component tests
npm run e2e       # Playwright + axe end-to-end suite
npm run build     # Production static build to dist/
npm run preview   # Serve the built dist/ at http://localhost:4173
```

## Roadmap

- [Product scope](roadmap/00-product-scope.md)
- [Mathematical semantics](roadmap/01-math-semantics.md)
- [Delivery phases](roadmap/02-delivery-phases.md)
- [Phase 1: Foundation](roadmap/03-foundation.md)
- [Phase 2: Basic calculator](roadmap/04-basic-calculator.md)
- [Phase 3: Scientific & trigonometry](roadmap/05-scientific-trigonometry.md)
- [Phase 4: Base conversion](roadmap/06-base-conversion.md)
- [Phase 5: Programmer & mixed-base](roadmap/07-programmer-calculator.md)
- [Phase 6: Coding toolbox](roadmap/08-coding-toolbox.md)
- [Phase 7: Polish & deployment](roadmap/09-release-deployment.md)

## Architecture in one paragraph

The build target is a static `dist/` directory: Vite + React + strict TypeScript on the front end, a restricted `mathjs` evaluator for scientific expressions, native `BigInt` for the programmer engine, a `BigInt`-backed rational representation for arbitrary-base conversion, and small typed modules for each toolbox utility. Vitest, `fast-check`, Playwright, and axe-core provide unit, property, end-to-end, and accessibility coverage. The advanced modes are lazy-loaded, the service worker caches the app shell for offline use, and localStorage holds preferences and opt-in history only.

## Privacy

calcRepo runs entirely in the browser. No telemetry is collected by default. Preferences and the opt-in history are stored in `localStorage` on your device and never leave it. To erase them, clear site data from your browser.

## Deployment

`npm run build` produces a self-contained `dist/` directory using base path `/calcRepo/`. Drop it onto any static host — GitHub Pages, Netlify, Cloudflare Pages, S3+CloudFront, or just open `dist/index.html` from disk. The included GitHub Actions workflow builds and tests on every push; a separate workflow publishes the built site on demand.

### GitHub Pages

Live site: **https://ghost666ak.github.io/calcRepo/**

Pages is configured to serve from the `gh-pages` branch root, which contains the production build (`dist/` output). The site is published via a small helper script:

```bash
npm run build:pages
# Then publish to gh-pages from a clean worktree:
git worktree add /tmp/gh-pages gh-pages || git worktree add /tmp/gh-pages -b gh-pages
cd /tmp/gh-pages
git rm -r . 2>/dev/null
cp -r ../../docs/. .
touch .nojekyll
git add -A && git commit -m "publish" && git push origin gh-pages
cd .. && git worktree remove /tmp/gh-pages --force
```

After the push, Pages rebuilds automatically (usually under a minute).

For a CI-driven flow, the workflow files in `.github/workflows/` (already written) can be added once a token with the `workflow` scope is available. They run the quality gate, build `dist/`, and publish via `actions/deploy-pages`.

## Contributing

1. Read the roadmap documents and the Beads epic.
2. Claim the relevant issue with `bd update <id> --claim` before editing.
3. Update tests alongside any contract change in `01-math-semantics.md`.
4. At handoff, run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`, and report the results with `git status`.
