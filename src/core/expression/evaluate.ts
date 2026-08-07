import { tokenize } from './parse';
import type { Token } from './token';
import type { EvalResult } from '../types';
import { domain, ok, precision, syntax } from './errors';

type NumberValue = number;

interface ParseState {
  tokens: Token[];
  index: number;
}

export interface EvaluateOptions {
  readonly maxLength: number;
  readonly maxDepth: number;
}

export const DEFAULT_OPTIONS: EvaluateOptions = {
  maxLength: 4096,
  maxDepth: 256,
};

type BinaryOp = Extract<Token['kind'], 'plus' | 'minus' | 'star' | 'slash' | 'caret'>;

const PRECEDENCE: Record<BinaryOp, number> = {
  plus: 1,
  minus: 1,
  star: 2,
  slash: 2,
  caret: 3,
};

export function evaluate(
  input: string,
  options: EvaluateOptions = DEFAULT_OPTIONS,
): EvalResult<NumberValue> {
  if (input.length > options.maxLength) {
    return precision(
      `Expression is ${input.length} characters; limit is ${options.maxLength}.`,
      'Shorten the expression or split it into steps.',
    );
  }
  const tokenized = tokenize(input);
  if ('error' in tokenized) {
    return syntax(tokenized.error.message, tokenized.error.hint);
  }
  const state: ParseState = { tokens: tokenized as Token[], index: 0 };
  if (peek(state).kind === 'eof') {
    return syntax('Nothing to evaluate.', 'Enter a number or "(", then press =.');
  }
  const result = parseBinaryExpression(state, options, 0, 0);
  if (!result.ok) return result;
  if (peek(state).kind !== 'eof') {
    const leftover = peek(state);
    if (leftover.kind === 'rparen') {
      return syntax('Unmatched closing parenthesis.', 'Remove the extra ")".');
    }
    if (leftover.kind === 'plus' || leftover.kind === 'minus') {
      return syntax('Expression ends with an operator.', 'Finish the value before pressing =.');
    }
    if (leftover.kind === 'star' || leftover.kind === 'slash' || leftover.kind === 'caret') {
      return syntax(`Expression ends with "${leftover.value}".`, 'Add the right-hand operand before pressing =.');
    }
    if (leftover.kind === 'percent') {
      return syntax('Percent sign with nothing after it.', 'Add a number before "%" or remove the stray "%".');
    }
    return syntax(
      `Unexpected token "${leftover.value || leftover.kind}" after expression.`,
      'Tap × between two values, or finish the expression before pressing =.',
    );
  }
  return result;
}

function peek(state: ParseState): Token {
  return state.tokens[state.index] ?? { kind: 'eof', value: '', position: 0 };
}

function consume(state: ParseState): Token {
  const token = state.tokens[state.index];
  state.index += 1;
  return token ?? { kind: 'eof', value: '', position: 0 };
}

function precedenceOf(token: Token): number {
  if (
    token.kind === 'plus' ||
    token.kind === 'minus' ||
    token.kind === 'star' ||
    token.kind === 'slash' ||
    token.kind === 'caret'
  ) {
    return PRECEDENCE[token.kind];
  }
  return 0;
}

function applyBinary(left: NumberValue, op: BinaryOp, right: NumberValue): EvalResult<NumberValue> {
  if (op === 'slash' && right === 0) {
    return domain('Division by zero is not allowed.', 'Use a non-zero divisor.');
  }
  let result: NumberValue;
  switch (op) {
    case 'plus':
      result = left + right;
      break;
    case 'minus':
      result = left - right;
      break;
    case 'star':
      result = left * right;
      break;
    case 'slash':
      result = left / right;
      break;
    case 'caret':
      result = Math.pow(left, right);
      if (!Number.isFinite(result)) {
        return domain('Power result is not finite.', 'Reduce the exponent magnitude.');
      }
      break;
  }
  return ok(result, formatNumber(result));
}

function applyPercent(value: NumberValue): EvalResult<NumberValue> {
  const result = value / 100;
  return ok(result, formatNumber(result));
}

function parseBinaryExpression(
  state: ParseState,
  options: EvaluateOptions,
  depth: number,
  minPrecedence: number,
): EvalResult<NumberValue> {
  if (depth > options.maxDepth) {
    return precision(
      `Expression nesting exceeds ${options.maxDepth}.`,
      'Reduce parentheses or break the expression into steps.',
    );
  }
  let left = parseUnary(state, options, depth);
  if (!left.ok) return left;
  while (true) {
    const opToken = peek(state);
    // Implicit multiplication: when a value is followed by another value-starter
    // (number, "(", or an identifier) without an operator, treat it as "×".
    // Examples that benefit: `88(2)`, `(1+2)3`, `2(3+4)`, `(1+2)(3+4)`.
    if (opToken.kind === 'number' || opToken.kind === 'lparen' || opToken.kind === 'ident') {
      const right = parseBinaryExpression(state, options, depth + 1, PRECEDENCE.star + 1);
      if (!right.ok) return right;
      const next = applyBinary(left.ok ? left.value : NaN, 'star', right.ok ? right.value : NaN);
      if (!next.ok) return next;
      left = next;
      continue;
    }
    const opPrecedence = precedenceOf(opToken);
    if (opPrecedence === 0 || opPrecedence < minPrecedence) break;
    if (
      opToken.kind !== 'plus' &&
      opToken.kind !== 'minus' &&
      opToken.kind !== 'star' &&
      opToken.kind !== 'slash' &&
      opToken.kind !== 'caret'
    ) {
      break;
    }
    const op: BinaryOp = opToken.kind;
    consume(state);
    // A trailing binary operator ("2+", "3*", "4/") is a common footgun;
    // surface it as a friendly error here instead of falling through.
    if (peek(state).kind === 'eof') {
      if (op === 'plus' || op === 'minus') {
        return syntax('Expression ends with an operator.', 'Finish the value before pressing =.');
      }
      return syntax(
        `Expression ends with "${opToken.value}".`,
        'Add the right-hand operand before pressing =.',
      );
    }
    const right = parseBinaryExpression(state, options, depth + 1, opPrecedence + 1);
    if (!right.ok) return right;
    const next = applyBinary(left.ok ? left.value : NaN, op, right.ok ? right.value : NaN);
    if (!next.ok) return next;
    left = next;
  }
  // Apply any postfix percents at the current level.
  while (peek(state).kind === 'percent') {
    consume(state);
    const next = applyPercent(left.ok ? left.value : NaN);
    if (!next.ok) return next;
    left = next;
  }
  return left;
}

function parseUnary(
  state: ParseState,
  options: EvaluateOptions,
  depth: number,
): EvalResult<NumberValue> {
  const token = peek(state);
  if (token.kind === 'minus') {
    consume(state);
    const inner = parseUnary(state, options, depth + 1);
    if (!inner.ok) return inner;
    const value = inner.ok ? -inner.value : NaN;
    return ok(value, formatNumber(value));
  }
  if (token.kind === 'plus') {
    consume(state);
    return parseUnary(state, options, depth + 1);
  }
  return parsePrimary(state, options, depth);
}

function parsePrimary(
  state: ParseState,
  options: EvaluateOptions,
  depth: number,
): EvalResult<NumberValue> {
  const token = peek(state);
  if (token.kind === 'number') {
    consume(state);
    const value = Number(token.value);
    if (!Number.isFinite(value)) {
      return syntax(`Invalid number "${token.value}".`, 'Use digits with at most one decimal point.');
    }
    return ok(value, formatNumber(value));
  }
  if (token.kind === 'lparen') {
    consume(state);
    const inner = parseBinaryExpression(state, options, depth + 1, 0);
    if (!inner.ok) return inner;
    const closer = peek(state);
    if (closer.kind !== 'rparen') {
      return syntax('Missing closing parenthesis.', 'Add the matching ")".');
    }
    consume(state);
    return inner;
  }
  if (token.kind === 'rparen') {
    return syntax('Unexpected ")".', 'Match every ")" with an opening "(".');
  }
  if (token.kind === 'percent') {
    return syntax('Stray "%".', 'Put a number or ")" before the percent sign.');
  }
  if (token.kind === 'comma') {
    return syntax('Unexpected ",".', 'Commas separate arguments inside supported functions.');
  }
  if (token.kind === 'eof') {
    return syntax('Expression is incomplete.', 'Add a number or ")" before pressing =.');
  }
  return syntax(
    `Expected a number or "(", but got "${token.value || token.kind}".`,
    'Use a digit, a decimal, or "(" to continue the expression.',
  );
}

const FORMAT = new Intl.NumberFormat('en-US', { maximumFractionDigits: 12, useGrouping: false });

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return 'Error';
  }
  if (Object.is(value, -0)) return '0';
  // Round to mitigate FP noise (e.g. 0.1 + 0.2)
  const rounded = Math.round(value * 1e12) / 1e12;
  return FORMAT.format(rounded);
}