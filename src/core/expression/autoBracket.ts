/**
 * Decide whether the previous expression needs to be wrapped in `( )`
 * when the user continues the calculation by pressing a binary
 * operator after `=`.
 *
 * Background: after `5 + 6 = 11` the calculator shows the result on
 * the big line and the original question on the small line. When the
 * user presses `*` we want the small line to show the *full*
 * continued question. Naively appending the new operator would give
 * `5 + 6 *`, but BODMAS binds the new `*` to `6`, so the top line
 * would mean `5 + (6 * x)` while the bottom (which continues from the
 * `11` result) means `(5 + 6) * x`. To keep both lines semantically
 * equal we wrap the previous question in `( )` whenever the new
 * operator has strictly higher precedence than the previous
 * question's top-level last operator.
 *
 * Examples (bottom shows the running continuation from the result):
 *   `5 + 6` + `+`  → top `5+6+`,   bottom `11+`   — no bracket
 *   `5 + 6` + `*`  → top `(5+6)*`, bottom `11*`   — bracket (BODMAS)
 *   `5 * 2` + `+`  → top `5*2+`,   bottom `10+`   — no bracket
 *   `5 * 2` + `^`  → top `(5*2)^`, bottom `10^`   — bracket
 *   `(2+3)` + `*`  → top `(2+3)*`, bottom `5*`    — no bracket
 *                                                (already grouped)
 *   `100%`   + `*` → top `100%*`,  bottom `1*`     — no bracket
 *                                                (no top-level op)
 */

const BINARY_OPS = new Set(['+', '-', '*', '/', '^', '%']);

/** Strict precedence: lower number binds less tightly. */
function precedence(op: string): number {
  switch (op) {
    case '+':
    case '-':
      return 1;
    case '*':
    case '/':
    case '%':
      return 2;
    case '^':
      return 3;
    default:
      return 0;
  }
}

/**
 * Walk `expr` and return the last binary operator seen at paren-depth
 * zero. Returns `null` when there is no such operator — e.g. for a
 * single literal, a fully-parenthesised expression, or a value with a
 * postfix (like `100%`).
 */
export function lastTopLevelBinaryOp(expr: string): string | null {
  // Strip trailing postfix operators (`%` and `!`) before scanning —
  // they apply to the preceding value, not as separators. Without this
  // step `100%` would look like it ends with a binary `%`, and the
  // auto-bracket rule would fire incorrectly.
  let trimmed = expr;
  while (trimmed.endsWith('%') || trimmed.endsWith('!')) {
    trimmed = trimmed.slice(0, -1);
  }
  let depth = 0;
  let last: string | null = null;
  for (let i = 0; i < trimmed.length; i += 1) {
    const ch = trimmed[i]!;
    if (ch === '(') {
      depth += 1;
    } else if (ch === ')') {
      depth -= 1;
      if (depth < 0) depth = 0;
    } else if (depth === 0 && BINARY_OPS.has(ch)) {
      last = ch;
    }
  }
  return last;
}

/**
 * Should the previous expression be wrapped in `( )` before appending
 * `newOp` to keep its meaning aligned with `lastResult + newOp`?
 */
export function needsContinuationBracket(
  prevExpression: string,
  newOp: string,
): boolean {
  if (!BINARY_OPS.has(newOp)) return false;
  const last = lastTopLevelBinaryOp(prevExpression);
  if (last === null) return false;
  return precedence(newOp) > precedence(last);
}