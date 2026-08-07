import { parseBaseLiteral } from '../base';
import {
  fromBigInt,
  type ProgrammerResult,
  type ProgrammerValue,
  type Signedness,
  type WordWidth,
} from './word';
import {
  bitwiseAnd,
  bitwiseNot,
  bitwiseOr,
  bitwiseXor,
  integerModulo,
  modularAdd,
  modularSubtract,
  rotateLeft,
  rotateRight,
  shiftLeft,
  shiftRight,
} from './operations';

export interface ProgrammerOptions {
  readonly width: WordWidth;
  readonly signedness: Signedness;
}

export const DEFAULT_PROGRAMMER_OPTIONS: ProgrammerOptions = {
  width: 32,
  signedness: 'unsigned',
};

type Op = 'or' | 'and' | 'xor' | 'shl' | 'shr' | 'rotl' | 'rotr' | 'plus' | 'minus' | 'mod';

const PRECEDENCE: Record<Op, number> = {
  or: 1,
  xor: 2,
  and: 3,
  shl: 4,
  shr: 4,
  rotl: 4,
  rotr: 4,
  plus: 5,
  minus: 5,
  mod: 6,
};

interface Expr {
  readonly pos: number;
}

interface Literal extends Expr {
  readonly kind: 'literal';
  readonly raw: string;
  readonly base: number;
}

interface Unary extends Expr {
  readonly kind: 'unary';
  readonly op: 'not' | 'minus';
  readonly operand: Node;
}

interface Binary extends Expr {
  readonly kind: 'binary';
  readonly op: Op;
  readonly left: Node;
  readonly right: Node;
}

interface Group extends Expr {
  readonly kind: 'group';
  readonly inner: Node;
}

type Node = Literal | Unary | Binary | Group;

export function evaluateProgrammer(input: string, options: ProgrammerOptions = DEFAULT_PROGRAMMER_OPTIONS): ProgrammerResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return {
      ok: false,
      error: { message: 'Expression is empty.', hint: 'Enter an integer expression, e.g. 0xFF & 0x0F.' },
    };
  }
  let parsed: Node;
  try {
    parsed = parseExpression(trimmed, 0, 0);
  } catch (error) {
    return expressionError(error);
  }
  if (parsed.pos < trimmed.length) {
    return {
      ok: false,
      error: {
        message: `Unexpected characters at position ${parsed.pos}.`,
        hint: 'Remove the extra text or finish the expression.',
      },
    };
  }
  return evaluateNode(parsed, options);
}

function parseError(message: string, hint: string): Error {
  const error = new Error(message);
  (error as Error & { hint?: string }).hint = hint;
  return error;
}

function expressionError(error: unknown): ProgrammerResult {
  if (error instanceof Error) {
    const hint = (error as Error & { hint?: string }).hint;
    return {
      ok: false,
      error: { message: error.message, hint: hint ?? 'Check the expression syntax.' },
    };
  }
  return {
    ok: false,
    error: { message: 'Unable to parse expression.', hint: 'Check the syntax.' },
  };
}

function parseExpression(input: string, start: number, minPrecedence: number): Node {
  let left = parseUnary(input, start);
  let pos = left.pos;
  while (pos < input.length) {
    const { op, next } = readOperator(input, pos);
    if (op === null) break;
    const precedence = PRECEDENCE[op];
    if (precedence < minPrecedence) break;
    const right = parseExpression(input, next, precedence + 1);
    left = { kind: 'binary', op, left, right, pos: right.pos };
    pos = right.pos;
  }
  return left;
}

function parseUnary(input: string, start: number): Node {
  const pos = skipWhitespace(input, start);
  const ch = input[pos] ?? '';
  if (ch === '~') {
    const operand = parseUnary(input, pos + 1);
    return { kind: 'unary', op: 'not', operand, pos: operand.pos };
  }
  if (ch === '-') {
    const operand = parseUnary(input, pos + 1);
    return { kind: 'unary', op: 'minus', operand, pos: operand.pos };
  }
  if (ch === '+') {
    return parseUnary(input, pos + 1);
  }
  return parsePrimary(input, pos);
}

function parsePrimary(input: string, start: number): Node {
  const pos = skipWhitespace(input, start);
  const ch = input[pos] ?? '';
  if (ch === '(') {
    const inner = parseExpression(input, pos + 1, 0);
    const close = skipWhitespace(input, inner.pos);
    if (input[close] !== ')') {
      throw parseError('Missing closing parenthesis.', 'Add the matching ")".');
    }
    return { kind: 'group', inner, pos: close + 1 };
  }
  return parseLiteral(input, pos);
}

function parseLiteral(input: string, start: number): Node {
  const begin = skipWhitespace(input, start);
  const slice = input.slice(begin);
  // 0-prefixed notations need to be checked BEFORE the generic decimal match.
  const prefixHex = slice.match(/^0x[0-9a-fA-F]+/);
  if (prefixHex) {
    return { kind: 'literal', raw: prefixHex[0], base: 16, pos: begin + prefixHex[0].length };
  }
  const prefixOct = slice.match(/^0o[0-7]+/);
  if (prefixOct) {
    return { kind: 'literal', raw: prefixOct[0], base: 8, pos: begin + prefixOct[0].length };
  }
  const prefixBin = slice.match(/^0b[01]+/);
  if (prefixBin) {
    return { kind: 'literal', raw: prefixBin[0], base: 2, pos: begin + prefixBin[0].length };
  }
  const basePrefix = slice.match(/^(\d+)#/);
  if (basePrefix) {
    const after = begin + basePrefix[0].length;
    const digits = input.slice(after).match(/^[0-9a-fA-Z]+/);
    if (!digits) {
      throw parseError('Base literal is missing digits.', 'Use base#digits, e.g. 16#FF.');
    }
    const literalText = input.slice(begin, after + digits[0].length);
    return { kind: 'literal', raw: literalText, base: Number(basePrefix[1]), pos: after + digits[0].length };
  }
  const decimal = slice.match(/^\d+(?:\.\d+)?/);
  if (decimal) {
    return { kind: 'literal', raw: decimal[0], base: 10, pos: begin + decimal[0].length };
  }
  throw parseError(`Unexpected character "${input[begin] ?? ''}"`, 'Use digits, base#digits, or operators.');
}

function readOperator(input: string, start: number): { op: Op | null; next: number } {
  const at = skipWhitespace(input, start);
  const ch = input[at] ?? '';
  if (ch === '|') return { op: 'or', next: at + 1 };
  if (ch === '&') return { op: 'and', next: at + 1 };
  if (ch === '^') return { op: 'xor', next: at + 1 };
  if (ch === '+') return { op: 'plus', next: at + 1 };
  if (ch === '-') return { op: 'minus', next: at + 1 };
  if (ch === '%') return { op: 'mod', next: at + 1 };
  const triple = input.slice(at, at + 3);
  if (triple === '<<<') return { op: 'rotl', next: at + 3 };
  if (triple === '>>>') return { op: 'rotr', next: at + 3 };
  const double = input.slice(at, at + 2);
  if (double === '<<') return { op: 'shl', next: at + 2 };
  if (double === '>>') return { op: 'shr', next: at + 2 };
  return { op: null, next: at };
}

function skipWhitespace(input: string, start: number): number {
  let pos = start;
  while (pos < input.length) {
    const ch = input[pos];
    if (ch === ' ' || ch === '\t') {
      pos += 1;
      continue;
    }
    break;
  }
  return pos;
}

function evaluateNode(node: Node, options: ProgrammerOptions): ProgrammerResult {
  switch (node.kind) {
    case 'literal':
      return literalToValue(node.raw, node.base ?? 10, options);
    case 'group':
      return evaluateNode(node.inner, options);
    case 'unary': {
      const inner = evaluateNode(node.operand, options);
      if (!inner.ok) return inner;
      if (node.op === 'not') return bitwiseNot(inner.value);
      if (node.op === 'minus') {
        return fromBigInt(-inner.value.raw, options.width, options.signedness);
      }
      return inner;
    }
    case 'binary': {
      const left = evaluateNode(node.left, options);
      if (!left.ok) return left;
      const right = evaluateNode(node.right, options);
      if (!right.ok) return right;
      return applyBinaryOp(left.value, right.value, node.op);
    }
  }
}

function literalToValue(raw: string, base: number, options: ProgrammerOptions): ProgrammerResult {
  const parsed = parseBaseLiteral(raw, raw.includes('#') ? undefined : base);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }
  if (parsed.value.denominator !== 1n) {
    return {
      ok: false,
      error: {
        message: `Fractional values are not allowed in bitwise expressions.`,
        hint: 'Remove the decimal point or use a whole number.',
      },
    };
  }
  return fromBigInt(parsed.value.numerator, options.width, options.signedness);
}

function applyBinaryOp(left: ProgrammerValue, right: ProgrammerValue, op: Op): ProgrammerResult {
  switch (op) {
    case 'and': return bitwiseAnd(left, right);
    case 'or': return bitwiseOr(left, right);
    case 'xor': return bitwiseXor(left, right);
    case 'shl': return shiftLeft(left, right);
    case 'shr': return shiftRight(left, right);
    case 'rotl': return rotateLeft(left, right);
    case 'rotr': return rotateRight(left, right);
    case 'plus': return modularAdd(left, right);
    case 'minus': return modularSubtract(left, right);
    case 'mod': return integerModulo(left, right);
  }
}

export function formatProgrammer(value: ProgrammerValue, base: number): string {
  return value.raw.toString(base);
}
