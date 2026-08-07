import type { ParseError } from './parse-error';
import type { Token } from './token';

const NUMBER_PATTERN = /^\d+(?:\.\d+)?|\.\d+/;

export function tokenize(input: string): readonly Token[] | { error: ParseError } {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i]!;
    if (ch === ' ' || ch === '\t') {
      i += 1;
      continue;
    }
    if (ch >= '0' && ch <= '9' || ch === '.') {
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
            hint: 'Allowed: digits, decimal point, + - * / ^ % ( )',
          },
        };
    }
    tokens.push({ kind, value: ch, position: i });
    i += 1;
  }
  tokens.push({ kind: 'eof', value: '', position: input.length });
  return tokens;
}