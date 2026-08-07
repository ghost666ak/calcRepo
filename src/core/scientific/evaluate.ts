import { tokenize } from '../expression/parse';
import type { Token } from '../expression/token';
import type { EvalResult } from '../types';
import { domain, ok, precision, syntax } from '../expression/errors';
import type { EvaluateOptions } from '../expression/evaluate';
import {
  SCIENTIFIC_CONSTANTS,
  SCIENTIFIC_FUNCTIONS,
  formatScientific,
  type ScientificValue,
} from './functions';
import type { AngleUnit } from './angle';

export interface ScientificOptions extends EvaluateOptions {
  readonly angleUnit: AngleUnit;
  readonly precisionDigits: number;
}

export const DEFAULT_SCIENTIFIC_OPTIONS: ScientificOptions = {
  maxLength: 4096,
  maxDepth: 256,
  angleUnit: 'RAD',
  precisionDigits: 12,
};

interface ParseState {
  tokens: Token[];
  index: number;
}

type BinaryOp = Extract<Token['kind'], 'plus' | 'minus' | 'star' | 'slash' | 'caret'>;

const PRECEDENCE: Record<BinaryOp, number> = {
  plus: 1,
  minus: 1,
  star: 2,
  slash: 2,
  caret: 3,
};

export function evaluateScientific(
  input: string,
  options: ScientificOptions = DEFAULT_SCIENTIFIC_OPTIONS,
): EvalResult<ScientificValue> {
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
    return syntax('Nothing to evaluate.', 'Enter a number, function, or "(", then press =.');
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

function applyBinary(left: ScientificValue, op: BinaryOp, right: ScientificValue, options: ScientificOptions): EvalResult<ScientificValue> {
  if (op === 'slash' && right === 0) {
    return domain('Division by zero is not allowed.', 'Use a non-zero divisor.');
  }
  let result: ScientificValue;
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
  return ok(result, formatScientific(result, options.precisionDigits));
}

function applyPercent(value: ScientificValue, options: ScientificOptions): EvalResult<ScientificValue> {
  const result = value / 100;
  return ok(result, formatScientific(result, options.precisionDigits));
}

function parseBinaryExpression(
  state: ParseState,
  options: ScientificOptions,
  depth: number,
  minPrecedence: number,
): EvalResult<ScientificValue> {
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
    // Implicit multiplication: value followed by value-starter means ×.
    if (opToken.kind === 'number' || opToken.kind === 'lparen' || opToken.kind === 'ident') {
      const right = parseBinaryExpression(state, options, depth + 1, PRECEDENCE.star + 1);
      if (!right.ok) return right;
      const next = applyBinary(left.ok ? left.value : NaN, 'star', right.ok ? right.value : NaN, options);
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
    const next = applyBinary(left.ok ? left.value : NaN, op, right.ok ? right.value : NaN, options);
    if (!next.ok) return next;
    left = next;
  }
  while (peek(state).kind === 'percent') {
    consume(state);
    const next = applyPercent(left.ok ? left.value : NaN, options);
    if (!next.ok) return next;
    left = next;
  }
  return left;
}

function parseUnary(
  state: ParseState,
  options: ScientificOptions,
  depth: number,
): EvalResult<ScientificValue> {
  const token = peek(state);
  if (token.kind === 'minus') {
    consume(state);
    const inner = parseUnary(state, options, depth + 1);
    if (!inner.ok) return inner;
    const value = inner.ok ? -inner.value : NaN;
    return ok(value, formatScientific(value, options.precisionDigits));
  }
  if (token.kind === 'plus') {
    consume(state);
    return parseUnary(state, options, depth + 1);
  }
  return parsePrimary(state, options, depth);
}

function parsePrimary(
  state: ParseState,
  options: ScientificOptions,
  depth: number,
): EvalResult<ScientificValue> {
  const token = peek(state);
  if (token.kind === 'number') {
    consume(state);
    const value = Number(token.value);
    if (!Number.isFinite(value)) {
      return syntax(`Invalid number "${token.value}".`, 'Use digits with at most one decimal point.');
    }
    return ok(value, formatScientific(value, options.precisionDigits));
  }
  if (token.kind === 'ident') {
    return parseIdentifier(state, options, depth);
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

function parseIdentifier(
  state: ParseState,
  options: ScientificOptions,
  depth: number,
): EvalResult<ScientificValue> {
  const token = peek(state);
  if (token.kind !== 'ident') {
    return syntax(`Unexpected token "${token.value}".`, 'Use digits, operators, parentheses, or function names.');
  }
  const name = token.value;
  if (Object.prototype.hasOwnProperty.call(SCIENTIFIC_CONSTANTS, name)) {
    consume(state);
    const value = SCIENTIFIC_CONSTANTS[name] ?? NaN;
    return ok(value, formatScientific(value, options.precisionDigits));
  }
  const func = SCIENTIFIC_FUNCTIONS[name];
  if (!func) {
    return syntax(`Unknown function "${name}".`, 'Use one of the supported scientific functions.');
  }
  consume(state);
  if (peek(state).kind !== 'lparen') {
    return syntax(`Function "${name}" requires "(...)".`, 'Wrap the argument(s) in parentheses.');
  }
  consume(state);
  const args: ScientificValue[] = [];
  if (peek(state).kind !== 'rparen') {
    const first = parseBinaryExpression(state, options, depth + 1, 0);
    if (!first.ok) return first;
    args.push(first.ok ? first.value : NaN);
    while (peek(state).kind === 'comma') {
      consume(state);
      const next = parseBinaryExpression(state, options, depth + 1, 0);
      if (!next.ok) return next;
      args.push(next.ok ? next.value : NaN);
    }
  }
  const closer = peek(state);
  if (closer.kind !== 'rparen') {
    return syntax(`Function "${name}" missing closing parenthesis.`, 'Close the function call with ")".');
  }
  consume(state);
  if (args.length !== func.args) {
    return syntax(
      `Function "${name}" expects ${func.args} argument(s), got ${args.length}.`,
      `Provide exactly ${func.args} argument(s).`,
    );
  }
  return func.evaluate(args, options.angleUnit, options.precisionDigits);
}