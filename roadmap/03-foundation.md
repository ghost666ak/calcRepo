# Phase 1 — Static app foundation

> **Status source of truth:** Beads feature `calcrepo_6d0819fe-3ps.2` with child tasks `.2.1`, `.2.2`, `.2.3`.

## Goal

Stand up the project skeleton that every later phase depends on: a static, accessible React app shell, strict TypeScript build configuration, design tokens, and an empty but verifiable evaluation pipeline. No product math yet.

## Deliverables

- Vite + React + strict TypeScript app producing a static `dist/`.
- Quality tooling: ESLint (typescript-eslint + jsx-a11y), Prettier, Vitest, Testing Library, Playwright with `@axe-core/playwright`.
- Updated `.gitignore` covering Node and editor artifacts while preserving existing Beads ignores.
- Design token layer with light/dark themes and a `prefers-reduced-motion` rule.
- App shell with mode tabs (placeholders), persistent display area, keypad primitives, settings drawer, and an error boundary.
- Typed `localStorage` adapter for later preference persistence.
- Smoke Vitest test, a11y Playwright smoke test, and an end-to-end Playwright run that opens the built app.

## File map

- `package.json`, `package-lock.json`, `tsconfig*.json`, `vite.config.ts`, `eslint.config.js`, `.prettierrc.json`, `vitest.config.ts`, `playwright.config.ts`.
- `index.html`, `src/main.tsx`, `src/app/App.tsx`, `src/app/AppShell.tsx`, `src/app/ErrorBoundary.tsx`.
- `src/components/{Display,Keypad,Key,ModeTabs,SettingsDrawer}.tsx`.
- `src/core/types.ts` (shared discriminated unions), `src/core/index.ts` (empty exports to prove the build).
- `src/state/preferences.ts` (typed storage adapter), `src/state/index.ts`.
- `src/styles/tokens.css`, `src/styles/global.css`, `src/styles/app.css`.
- `tests/unit/shell.test.tsx`, `tests/e2e/shell.spec.ts`.

## Verification

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` all succeed.
- `npx playwright test` opens the built app and asserts the shell renders and is axe-clean.
- A smoke `unit` test renders the shell and confirms the display shows `0` initially.
- `git status` reported at handoff; no commit, push, or deploy performed.