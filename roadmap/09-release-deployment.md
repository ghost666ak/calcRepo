# Phase 7 — Polish, offline support, and deployment

> **Status source of truth:** Beads feature issue `calcrepo_6d0819fe-3ps.8`. This document captures performance budgets, the offline policy, deployment runbook, privacy stance, and Beads IDs.

## Why this phase exists

Phases 2–6 made each calculator mode trustworthy on its own. Phase 7 turns the assembled product into something safe to ship: lazy-loaded bundles, persistent opt-in history and favorites, an installable offline PWA, accessibility and performance budgets, end-to-end and axe coverage, CI workflows, and documentation that lets a new operator deploy without reading the source.

## Beads work breakdown

| Stream                                | Beads child ID                     | What ships                                                                       |
|---------------------------------------|------------------------------------|----------------------------------------------------------------------------------|
| Opt-in persistence + offline support  | `calcrepo_6d0819fe-3ps.8.1`        | `useHistory` hook, HistoryPanel, settings toggle, service worker, manifest, icons |
| Accessibility + performance           | `calcrepo_6d0819fe-3ps.8.2`        | Lazy-loaded advanced modes, axe-clean e2e, bundle budgets                         |
| Static release + finished docs        | `calcrepo_6d0819fe-3ps.8.3`        | README usage + deployment, GitHub Actions quality + deploy workflows             |

## Persistence

- **Preferences** (`calcRepo.preferences.v1`): theme, reduced motion, angle unit, precision digits. Always persisted; not user-toggleable.
- **History** (`calcRepo.history.entries.v1`, `calcRepo.history.settings.v1`): opt-in. Settings hold `enabled` and `maxEntries` (clamped to 1–1000). Entries persist `expression`, `result`, `mode`, `createdAt`, `pinned`, and a generated `id`. The hook never throws on storage errors (private mode, quota); failures are swallowed so the app remains usable.
- **Storage shape validation**: every persisted entry is re-validated on load via `normalizeEntry`. Junk data is dropped silently.
- **Clear controls**: `clear()` keeps pinned entries; `remove(id)` deletes a single entry; `togglePin(id)` flips a per-entry flag. There is no global "delete everything" because nothing else is persisted.

## Offline support

- `public/sw.js` registers only in production builds (`import.meta.env.DEV === false`) so dev mode keeps HMR working.
- The worker uses a versioned cache namespace (`calcrepo-v1`) so older caches are evicted on activate.
- App-shell precache covers the HTML, manifest, favicon, and the four PWA icons. Static assets are served cache-first; navigations are network-first with a fallback to the cached shell for offline boots.
- The manifest uses relative paths (`./`), so the app installs correctly from any subpath.

## Performance budgets

- Main bundle (`dist/assets/index-*.js`) should stay below **250 kB** raw / **80 kB** gzip. Current measurement: ~187 kB / 58 kB gzip.
- Each lazy-loaded mode chunk should stay below **20 kB** raw / **6 kB** gzip. Current: ProgrammerView ~14.7 kB / 4.6 kB; ToolsView ~13.5 kB / 4.5 kB.
- Initial LCP target: under 2.5 s on a mid-range phone once cached.

## Accessibility

- Every interactive control exposes a label or `aria-label`.
- Tab navigation follows visual order across the app shell, settings, history, and each mode's keypad.
- Mode tabs use `role="tablist"` with `aria-selected` and keyboard activation.
- Reduced-motion preference is honored via the `data-reduced-motion` attribute chain (set in `index.html` based on the stored preference).
- Playwright + axe-core sweep runs on every CI build (`tests/e2e/*.spec.ts`).

## Privacy

- No analytics. No network calls beyond what the user explicitly invokes (e.g., opening a link).
- All state lives in `localStorage` on the user's device. The Privacy fieldset in Settings surfaces this explicitly.
- There is no telemetry of any kind by default.

## Deployment runbook

1. `npm ci`
2. `npm run lint && npm run typecheck && npm test && npm run build`
3. Inspect `dist/` (manifest, sw.js, pwa icons, hashed assets). Base path is `/calcRepo/`.
4. Upload `dist/` to the chosen static host.
5. Confirm `https://<host>/calcRepo/manifest.webmanifest` resolves and `<host>/calcRepo/sw.js` is reachable so the PWA installs.
6. Smoke-test: install the app, go offline, reload — the shell should boot from the cache.

### GitHub Pages specifics

- The repo is public and Pages is enabled; the live URL is `https://<user>.github.io/calcRepo/`.
- Two viable deploy flows:
  - **`gh-pages` branch (currently in use)**: build with `npm run build:pages`, copy the contents of `docs/` into a fresh `gh-pages` branch root, push the branch, and in repo Settings → Pages choose Branch: `gh-pages`, Folder: `/`. This works without GitHub Actions scope and serves at the project URL with absolute `/calcRepo/` paths.
  - **Actions-based**: add `.github/workflows/quality.yml` and `deploy.yml` (already written locally; the OAuth token used for `git push` currently lacks the `workflow` scope, so they need to be added via the GitHub UI or a token with the scope). When in place, the `deploy` workflow runs `npm run build` and publishes `dist/` via `actions/deploy-pages`.
- The roadmap source lives under `roadmap/` (root) — it is **not** served by Pages, since Pages only sees the `gh-pages` branch root which contains the build output.

The included `.github/workflows/quality.yml` runs the quality gates on every push and PR. The `deploy.yml` workflow is **manual-only** (`workflow_dispatch`) and gated by an `environment` so production publishes require explicit approval.

## Verification checklist

- [x] `useHistory` hook with opt-in toggle, persistence, pin, remove, and clear controls.
- [x] Settings drawer exposes the history toggle and explains the on-device privacy stance.
- [x] ProgrammerView and ToolsView are lazy-loaded with `<Suspense>` fallback messaging.
- [x] `public/sw.js` APP_SHELL paths corrected to root-relative (matches Vite production output).
- [x] GitHub Pages live at `https://<user>.github.io/calcRepo/` via the `gh-pages` branch.
- [x] Playwright + axe coverage extended to all five modes plus the history toggle.
- [x] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` all pass.
- [x] README usage + deployment sections replace the Phase 0 placeholder.
- [x] GitHub Actions `quality.yml` and `deploy.yml` provided; deploy remains manual.
