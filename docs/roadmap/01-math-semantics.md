# Mathematical semantics

> **Status source of truth:** Beads issue `calcrepo_6d0819fe-3ps.1.2`. This contract must remain stable while later phases are built; tests must derive from it.

## 1. Numeric representation

- **Basic and scientific modes** use `mathjs.BigNumber` configured for `BigNumber.config({ precision: 64 })`. Fast mode may use IEEE-754 doubles but only when the user explicitly selects it in scientific mode.
- **Programmer mode** uses native `BigInt` for exact integer and bitwise arithmetic. `Number` is forbidden inside the programmer engine.
- **Base conversion** uses a `BigInt`-backed signed rational representation (`numerator` and `denominator`) so signed fractions can convert between bases without passing through floating point.

## 2. Operators and precedence

Implemented precedence (high → low):

1. Parentheses `( )`
2. Function call `name(args)` and constants `pi`, `e`
3. Unary `+`, `-`, factorial `!`
4. Power `^`
5. Multiplication/division `*`, `/`, implicit multiplication
6. Addition/subtraction `+`, `-`

`%` is percent in the basic calculator: `a %` means `a / 100`. In scientific mode, `a mod b` is the modulo operator; `nPr`, `nCr`, and `!` are combinatorics.

## 3. Angle unit contract

- Default for trigonometric mode is `RAD`; for the basic calculator it is irrelevant and hidden.
- Selector is always visible whenever a trig function is reachable.
- Inverse trigonometric functions return the selected unit.
- Conversions: `deg = rad × 180/π`, `grad = rad × 200/π`. No silent conversion occurs elsewhere.

## 4. Error model

Every evaluator returns a discriminated union with one of:

- `ok(value, formatted)`
- `domain(message, hint)`
- `syntax(message, position, hint)`
- `precision(message, hint)` (for limits like factorial of a non-integer)
- `internal(message)`

Errors are rendered with their hint and never propagate as raw `NaN`, `undefined`, or empty strings.

## 5. Literal syntax

| Form       | Example        | Meaning                          |
|------------|----------------|----------------------------------|
| Decimal    | `123`, `-0.5`  | Default literal                  |
| Hex        | `0xFF`         | Base 16                          |
| Octal      | `0o17`         | Base 8                           |
| Binary     | `0b1010`       | Base 2                           |
| Arbitrary  | `b#digits`     | Base 2–36, lowercase `b`, e.g. `36#Z`, `2#1011` |

Unprefixed literals are always decimal. Mixed-base expressions like `16#FF + 2#1010` are allowed in programmer mode; the literal's value is normalized before evaluation so the user does not need to convert manually.

## 6. Base conversion rules

- Supported bases: 2–36, signed integers, signed fractions.
- Output digit cap is configurable (default 64); truncation must be explicit and reproducible.
- Repeating fractions are detected by periodic remainders and labelled in the output (e.g. `1/3 = 0.1` with a visible repeat marker).
- Swap, presets `BIN/OCT/DEC/HEX`, grouped digits, copy, and explicit invalid-digit errors are required.

## 7. Programmer contract

- Word widths: `8`, `16`, `32`, `64`. `0` means "no width limit".
- Signed mode uses two's complement; unsigned mode uses the full range.
- Bitwise operators accept integers only. Fractional operands yield a typed `domain` error.
- Overflow sets a visible flag; the result is still the documented masked value so users can reason about it.
- Shifts and rotates are masked to the active width; logical shifts are the default.

## 8. Safety limits

- Expression length: 4 096 characters.
- Exponent range: ±1 000 000 in BigNumber mode.
- Factorial operand limit: `n ≤ 170` to keep results finite.
- Nested recursion depth: 256 (configurable, enforced).
- Repeated remainder table for fraction detection caps at the configured digit cap.

These limits prevent accidental browser hangs. They are surfaced to the user as a typed `precision` error.