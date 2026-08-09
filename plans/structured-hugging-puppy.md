# Plan: Make base converter's Source/Target base inputs actually editable

## Context

The Source/Target base number inputs in the BaseView look editable, but every
invalid keystroke is silently dropped by the hook:

- User types `40` — hook rejects (out of 2-36), input visually stays at the
  last valid value (10). The user can't tell whether the input works at all.
- User clears the field — `Number('') === 0` is invalid, state stays at 10, the
  visible value snaps back to 10.
- User types `2.5` — `Number('2.5') === 2.5` is not an integer, rejected, snaps
  back.
- Even valid intermediate values (like `4` on the way to `40`) are correctly
  committed, but the user has no idea anything is happening.

The fix is to make the inputs feel responsive: every keystroke is reflected in
the visible field, and validation feedback is shown (a hint + red border) when
the user is out of range. The state is only updated when the input is valid.

## Implementation

### 1. Switch inputs to controlled text fields (`src/features/base/BaseView.tsx`)

Replace the two `<input type="number" min={MIN_BASE} max={MAX_BASE} …>` with
`<input type="text" inputMode="numeric" pattern="[0-9]+" …>`. This avoids the
browser's auto-clamp behaviour and the spinner buttons (which made the field
feel like a control rather than a free-form input). Keep `min`/`max` as
attributes for screen-reader hint, but rely on JS validation.

### 2. Local "draft" state for the text (`src/features/base/useBaseConverter.ts`)

Replace the existing `sourceBase` / `targetBase` numeric state with:

- `sourceBase` / `targetBase` — last **valid** number, unchanged in shape.
- `sourceBaseDraft` / `targetBaseDraft` — the raw text the user has typed.
- `sourceBaseError` / `targetBaseError` — derived: `null` if draft is empty
  (the field is in the "default" state) or parses to an integer in
  `[MIN_BASE, MAX_BASE]`; otherwise a short message
  (`base.outOfRange` with `{ min: MIN_BASE, max: MAX_BASE }`).

The view reads the draft for the input's `value`, the error for the hint/border,
and the numeric `sourceBase` for the actual conversion (computed from the draft
when valid, otherwise the previous valid value).

### 3. Hook surface (`useBaseConverter.ts`)

- Expose `sourceBaseDraft`, `sourceBaseError`, `targetBaseDraft`,
  `targetBaseError` from the hook.
- Keep `setSourceBase` / `setTargetBase` (now accepting a string draft) as the
  only setter the view calls.

### 4. View changes (`src/features/base/BaseView.tsx`)

- Bind `value` to the draft, not the numeric state.
- Apply `aria-invalid={!!error}` to the input.
- Render an inline hint when `error` is set:
  `<p className="base-view__error" data-testid="base-source-error">…</p>`.
- Add `(2-36)` to the existing label so the range is visible without a click.

### 5. CSS (`src/styles/app.css`)

Add a single rule under `.base-view__field`:

- `.base-view__field input[aria-invalid="true"]` → red border (use the same
  `--color-error` token used by `display__error`).
- Reuse `.display__error` styling for the inline error message (or a new
  `base-view__error` class with the same look).

### 6. i18n (`src/i18n/messages.ts`)

Add to the `base` namespace in both `en` and `hi`:

- `outOfRange` — `"Base must be an integer from {min} to {max}."`
  / `"आधार {min} से {max} के बीच एक पूर्णांक होना चाहिए।"`.
- `baseRangeLabel` — `"{label} (2-36)"` (the new suffix is part of the label
  text, not a separate interpolation). Actually, simpler: keep the existing
  `sourceBase` / `targetBase` labels and append `"(2-36)"` in the view. No
  new label key needed; only the error message needs i18n.

### 7. Tests (`tests/unit/base-view.test.tsx`)

Add a new `describe('Source/Target base input')` block:

- Typing a valid value (`7`) updates both the input and the conversion.
- Typing an out-of-range value (`40`) leaves the visible text as `40` and
  shows the `base-source-error` element with the range hint; the conversion
  falls back to the previous valid base.
- Typing a decimal (`2.5`) is reflected in the input but shows the same error.
- Clearing the input clears the error (empty is treated as "no input yet",
  not as an error), and the conversion uses the previous valid base.
- `aria-invalid="true"` is set on the input when the value is out of range.

The existing tests (`base-view.test.tsx`) must continue to pass — they
exercise the swap and the conversion flow, both of which still work because
the numeric `sourceBase` / `targetBase` state is preserved for valid values
and unchanged in shape.

## Files to modify

- `src/features/base/BaseView.tsx` — switch to text input, render error.
- `src/features/base/useBaseConverter.ts` — draft + error state.
- `src/styles/app.css` — `aria-invalid` border, error message style.
- `src/i18n/messages.ts` — `base.outOfRange` (en + hi).
- `tests/unit/base-view.test.tsx` — new input tests.

## Reused utilities

- `isValidBase` in `useBaseConverter.ts:34-36` — already does
  `Number.isInteger && >= 2 && <= 36`. Extract to a small shared validator
  so the same logic runs in the new draft-to-number path.
- `MIN_BASE` / `MAX_BASE` in `src/core/base/parse.ts:4-5` — already
  imported by `useBaseConverter.ts`.
- `display__error` CSS class (`src/styles/app.css:1021`) — reuse for the
  inline error so it visually matches the converter's own errors.

## Verification

1. `npm run lint` — clean.
2. `npm run typecheck` — clean.
3. `npm test` — all green; the new input tests pass alongside the existing
   base-view tests.
4. Manual smoke in `npm run dev`:
   - Open Base tab.
   - Click in Source base, type `40` → field shows `40`, red border + hint
     "Base must be an integer from 2 to 36.", conversion output uses the
     last valid base.
   - Clear the field → hint disappears, no error, conversion uses previous
     base.
   - Type `7` → field shows `7`, no error, conversion uses base 7.
5. `npm run build:pages` — exit 0.
