import type { ParseError } from './parse-error';
import type { Token } from './token';

const NUMBER_PATTERN = /^\d+(?:\.\d+)?|\.\d+/;

// Numbers like "8.5.5" must be rejected at the tokeniser so implicit
// multiplication does not silently turn a typo into a valid product.
function looksLikeMultipleDecimal(input: string, start: number): boolean {
  let sawDot = false;
  let i = start;
  while (i < input.length) {
    const ch = input[i]!;
    if (ch >= '0' && ch <= '9') {
      i += 1;
      continue;
    }
    if (ch === '.') {
      if (sawDot) return true;
      sawDot = true;
      i += 1;
      continue;
    }
    break;
  }
  return false;
}
const IDENT_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*/;

export function tokenize(input: string): readonly Token[] | { error: ParseError } {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i]!;
    if (ch === ' ' || ch === '\t') {
      i += 1;
      continue;
    }
    if (ch === ',') {
      tokens.push({ kind: 'comma', value: ',', position: i });
      i += 1;
      continue;
    }
    if (ch >= '0' && ch <= '9' || ch === '.') {
      if (looksLikeMultipleDecimal(input, i)) {
        return {
          error: {
            message: 'Number has more than one decimal point.',
            position: i,
            hint: 'Use digits and a single decimal point.',
          },
        };
      }
      const match = input.slice(i).match(NUMBER_PATTERN);
      if (!match) {
        return {
          error: {
            message: `Unexpected character "${ch}"`,
            position: i,
            hint: 'Use digits and a single decimal point.',
          },
        };
      }
      tokens.push({ kind: 'number', value: match[0], position: i });
      i += match[0].length;
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      const match = input.slice(i).match(IDENT_PATTERN);
      if (!match) {
        return {
          error: {
            message: `Unexpected character "${ch}"`,
            position: i,
            hint: 'Identifiers must start with a letter.',
          },
        };
      }
      tokens.push({ kind: 'ident', value: match[0], position: i });
      i += match[0].length;
      continue;
    }
    let kind: Token['kind'];
    switch (ch) {
      case '+':
        kind = 'plus';
        break;
      case '-':
        kind = 'minus';
        break;
      case '*':
        kind = 'star';
        break;
      case '/':
        kind = 'slash';
        break;
      case '^':
        kind = 'caret';
        break;
      case '%':
        kind = 'percent';
        break;
      case '(':
        kind = 'lparen';
        break;
      case ')':
        kind = 'rparen';
        break;
      default:
        return {
          error: {
            message: `Unexpected character "${ch}"`,
            position: i,
            hint: 'Allowed: digits, decimal point, identifiers, + - * / ^ % ( ) ,',
          },
        };
    }
    tokens.push({ kind, value: ch, position: i });
    i += 1;
  }
  tokens.push({ kind: 'eof', value: '', position: input.length });
  return tokens;
}