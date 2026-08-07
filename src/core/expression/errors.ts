import type { EvalResult } from '../types';

export type NumberValue = number;

export function ok(value: NumberValue, formatted: string): EvalResult<NumberValue> {
  return { ok: true, value, formatted };
}

export function domain(message: string, hint: string): EvalResult<NumberValue> {
  return { ok: false, kind: 'domain', message, hint };
}

export function syntax(message: string, hint: string): EvalResult<NumberValue> {
  return { ok: false, kind: 'syntax', message, hint };
}

export function precision(message: string, hint: string): EvalResult<NumberValue> {
  return { ok: false, kind: 'precision', message, hint };
}