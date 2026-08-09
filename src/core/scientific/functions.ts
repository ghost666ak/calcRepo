import type { EvalResult } from '../types';
import { domain, ok, precision, syntax } from '../expression/errors';
import type { AngleUnit } from '../types';

export type ScientificValue = number;

export type ArgCount = 1 | 2;

export interface ScientificFunction {
  readonly name: string;
  readonly label: string;
  readonly description: string;
  readonly category: 'power' | 'log' | 'trig' | 'inverse-trig' | 'hyperbolic' | 'combinatorics' | 'misc';
  readonly args: ArgCount;
  readonly evaluate: (args: readonly ScientificValue[], angle: AngleUnit, precisionDigits: number) => EvalResult<ScientificValue>;
}

const DEFAULT_PRECISION = 12;

function factorial(n: ScientificValue, precisionDigits: number): EvalResult<ScientificValue> {
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
    return domain('Factorial requires a non-negative integer.', 'Use n! only with integer n ≥ 0.');
  }
  if (n > 170) {
    return precision(
      `Factorial of ${n} exceeds the safe limit.`,
      'Keep n! ≤ 170 to stay within finite precision.',
    );
  }
  let result = 1;
  for (let i = 2; i <= n; i += 1) {
    result *= i;
  }
  return ok(result, formatScientific(result, precisionDigits));
}

function permutations(n: ScientificValue, k: ScientificValue, precisionDigits: number): EvalResult<ScientificValue> {
  if (
    !Number.isInteger(n) ||
    !Number.isInteger(k) ||
    n < 0 ||
    k < 0 ||
    k > n
  ) {
    return domain('nPr requires 0 ≤ k ≤ n with both integers.', 'Adjust n and k to integers with k ≤ n.');
  }
  if (n > 170) {
    return precision(`nPr limit exceeded for n=${n}.`, 'Keep n ≤ 170.');
  }
  let result = 1;
  for (let i = 0; i < k; i += 1) {
    result *= n - i;
  }
  return ok(result, formatScientific(result, precisionDigits));
}

function combinations(n: ScientificValue, k: ScientificValue, precisionDigits: number): EvalResult<ScientificValue> {
  if (
    !Number.isInteger(n) ||
    !Number.isInteger(k) ||
    n < 0 ||
    k < 0 ||
    k > n
  ) {
    return domain('nCr requires 0 ≤ k ≤ n with both integers.', 'Adjust n and k to integers with k ≤ n.');
  }
  if (n > 170) {
    return precision(`nCr limit exceeded for n=${n}.`, 'Keep n ≤ 170.');
  }
  const kEff = Math.min(k, n - k);
  let numerator = 1;
  let denominator = 1;
  for (let i = 0; i < kEff; i += 1) {
    numerator *= n - i;
    denominator *= i + 1;
  }
  const result = numerator / denominator;
  return ok(result, formatScientific(result, precisionDigits));
}

function toRadians(value: ScientificValue, angle: AngleUnit): ScientificValue {
  if (angle === 'DEG') return (value * Math.PI) / 180;
  if (angle === 'GRAD') return (value * Math.PI) / 200;
  return value;
}

function fromRadians(value: ScientificValue, angle: AngleUnit): ScientificValue {
  if (angle === 'DEG') return (value * 180) / Math.PI;
  if (angle === 'GRAD') return (value * 200) / Math.PI;
  return value;
}

export function formatScientific(value: number, precisionDigits: number = DEFAULT_PRECISION): string {
  if (!Number.isFinite(value)) return 'Error';
  if (Object.is(value, -0)) return '0';
  const decimals = Math.max(0, Math.min(precisionDigits, 12));
  const rounded = decimals === 0 ? Math.round(value) : Math.round(value * 10 ** decimals) / 10 ** decimals;
  const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
    useGrouping: false,
  });
  return trimTrailingZeros(formatter.format(rounded));
}

/** Strip trailing zeros after the decimal point. If every fractional digit is
 *  zero, also strip the decimal point so `5.00000` → `5`, `5.50000` → `5.5`.
 *  Preserves a leading minus sign. Pure display layer — does not change the
 *  underlying numeric value. */
function trimTrailingZeros(s: string): string {
  if (!s.includes('.')) return s;
  const sign = s.startsWith('-') ? '-' : '';
  const body = sign ? s.slice(1) : s;
  return sign + body.replace(/0+$/, '').replace(/\.$/, '');
}

export const SCIENTIFIC_FUNCTIONS: Record<string, ScientificFunction> = {
  sqrt: {
    name: 'sqrt',
    label: '√',
    description: 'Square root.',
    category: 'power',
    args: 1,
    evaluate: ([value], _angle, precisionDigits) => {
      if (value === undefined) return syntax('sqrt expects one argument.', 'Pass a single value.');
      if (value < 0) return domain('sqrt is undefined for negative numbers.', 'Use a non-negative input.');
      const result = Math.sqrt(value);
      return ok(result, formatScientific(result, precisionDigits));
    },
  },
  cbrt: {
    name: 'cbrt',
    label: '∛',
    description: 'Cube root.',
    category: 'power',
    args: 1,
    evaluate: ([value], _angle, precisionDigits) => {
      if (value === undefined) return syntax('cbrt expects one argument.', 'Pass a single value.');
      const result = Math.cbrt(value);
      return ok(result, formatScientific(result, precisionDigits));
    },
  },
  ln: {
    name: 'ln',
    label: 'ln',
    description: 'Natural logarithm.',
    category: 'log',
    args: 1,
    evaluate: ([value], _angle, precisionDigits) => {
      if (value === undefined) return syntax('ln expects one argument.', 'Pass a single value.');
      if (value <= 0) return domain('ln is undefined for non-positive numbers.', 'Use a strictly positive input.');
      const result = Math.log(value);
      return ok(result, formatScientific(result, precisionDigits));
    },
  },
  log10: {
    name: 'log10',
    label: 'log₁₀',
    description: 'Base-10 logarithm.',
    category: 'log',
    args: 1,
    evaluate: ([value], _angle, precisionDigits) => {
      if (value === undefined) return syntax('log10 expects one argument.', 'Pass a single value.');
      if (value <= 0) return domain('log10 is undefined for non-positive numbers.', 'Use a strictly positive input.');
      const result = Math.log10(value);
      return ok(result, formatScientific(result, precisionDigits));
    },
  },
  log2: {
    name: 'log2',
    label: 'log₂',
    description: 'Base-2 logarithm.',
    category: 'log',
    args: 1,
    evaluate: ([value], _angle, precisionDigits) => {
      if (value === undefined) return syntax('log2 expects one argument.', 'Pass a single value.');
      if (value <= 0) return domain('log2 is undefined for non-positive numbers.', 'Use a strictly positive input.');
      const result = Math.log2(value);
      return ok(result, formatScientific(result, precisionDigits));
    },
  },
  exp: {
    name: 'exp',
    label: 'eˣ',
    description: 'Exponential function.',
    category: 'log',
    args: 1,
    evaluate: ([value], _angle, precisionDigits) => {
      if (value === undefined) return syntax('exp expects one argument.', 'Pass a single value.');
      const result = Math.exp(value);
      if (!Number.isFinite(result)) {
        return domain('exp result is not finite.', 'Reduce the exponent.');
      }
      return ok(result, formatScientific(result, precisionDigits));
    },
  },
  pow: {
    name: 'pow',
    label: 'xʸ',
    description: 'Power function.',
    category: 'power',
    args: 2,
    evaluate: ([base, exponent], _angle, precisionDigits) => {
      if (base === undefined || exponent === undefined) {
        return syntax('pow expects two arguments.', 'Pass base and exponent.');
      }
      const result = Math.pow(base, exponent);
      if (!Number.isFinite(result)) {
        return domain('pow result is not finite.', 'Reduce the exponent magnitude.');
      }
      return ok(result, formatScientific(result, precisionDigits));
    },
  },
  sin: {
    name: 'sin',
    label: 'sin',
    description: 'Sine (angle unit visible in the UI).',
    category: 'trig',
    args: 1,
    evaluate: ([value], angle, precisionDigits) => {
      if (value === undefined) return syntax('sin expects one argument.', 'Pass a single value.');
      const radians = toRadians(value, angle);
      const result = Math.sin(radians);
      return ok(result, formatScientific(result, precisionDigits));
    },
  },
  cos: {
    name: 'cos',
    label: 'cos',
    description: 'Cosine (angle unit visible in the UI).',
    category: 'trig',
    args: 1,
    evaluate: ([value], angle, precisionDigits) => {
      if (value === undefined) return syntax('cos expects one argument.', 'Pass a single value.');
      const radians = toRadians(value, angle);
      const result = Math.cos(radians);
      return ok(result, formatScientific(result, precisionDigits));
    },
  },
  tan: {
    name: 'tan',
    label: 'tan',
    description: 'Tangent (angle unit visible in the UI).',
    category: 'trig',
    args: 1,
    evaluate: ([value], angle, precisionDigits) => {
      if (value === undefined) return syntax('tan expects one argument.', 'Pass a single value.');
      const radians = toRadians(value, angle);
      const result = Math.tan(radians);
      if (!Number.isFinite(result)) {
        return domain(`tan is undefined at ${value} ${angle}.`, 'Use an angle where tan is finite.');
      }
      return ok(result, formatScientific(result, precisionDigits));
    },
  },
  asin: {
    name: 'asin',
    label: 'sin⁻¹',
    description: 'Inverse sine (returns the selected angle unit).',
    category: 'inverse-trig',
    args: 1,
    evaluate: ([value], angle, precisionDigits) => {
      if (value === undefined) return syntax('asin expects one argument.', 'Pass a single value.');
      if (value < -1 || value > 1) {
        return domain('asin is undefined for |x| > 1.', 'Use an input between -1 and 1.');
      }
      const radians = Math.asin(value);
      const result = fromRadians(radians, angle);
      return ok(result, formatScientific(result, precisionDigits));
    },
  },
  acos: {
    name: 'acos',
    label: 'cos⁻¹',
    description: 'Inverse cosine (returns the selected angle unit).',
    category: 'inverse-trig',
    args: 1,
    evaluate: ([value], angle, precisionDigits) => {
      if (value === undefined) return syntax('acos expects one argument.', 'Pass a single value.');
      if (value < -1 || value > 1) {
        return domain('acos is undefined for |x| > 1.', 'Use an input between -1 and 1.');
      }
      const radians = Math.acos(value);
      const result = fromRadians(radians, angle);
      return ok(result, formatScientific(result, precisionDigits));
    },
  },
  atan: {
    name: 'atan',
    label: 'tan⁻¹',
    description: 'Inverse tangent (returns the selected angle unit).',
    category: 'inverse-trig',
    args: 1,
    evaluate: ([value], angle, precisionDigits) => {
      if (value === undefined) return syntax('atan expects one argument.', 'Pass a single value.');
      const radians = Math.atan(value);
      const result = fromRadians(radians, angle);
      return ok(result, formatScientific(result, precisionDigits));
    },
  },
  sinh: {
    name: 'sinh',
    label: 'sinh',
    description: 'Hyperbolic sine.',
    category: 'hyperbolic',
    args: 1,
    evaluate: ([value], _angle, precisionDigits) => {
      if (value === undefined) return syntax('sinh expects one argument.', 'Pass a single value.');
      const result = Math.sinh(value);
      if (!Number.isFinite(result)) {
        return domain('sinh result is not finite.', 'Reduce the magnitude.');
      }
      return ok(result, formatScientific(result, precisionDigits));
    },
  },
  cosh: {
    name: 'cosh',
    label: 'cosh',
    description: 'Hyperbolic cosine.',
    category: 'hyperbolic',
    args: 1,
    evaluate: ([value], _angle, precisionDigits) => {
      if (value === undefined) return syntax('cosh expects one argument.', 'Pass a single value.');
      const result = Math.cosh(value);
      if (!Number.isFinite(result)) {
        return domain('cosh result is not finite.', 'Reduce the magnitude.');
      }
      return ok(result, formatScientific(result, precisionDigits));
    },
  },
  tanh: {
    name: 'tanh',
    label: 'tanh',
    description: 'Hyperbolic tangent.',
    category: 'hyperbolic',
    args: 1,
    evaluate: ([value], _angle, precisionDigits) => {
      if (value === undefined) return syntax('tanh expects one argument.', 'Pass a single value.');
      const result = Math.tanh(value);
      return ok(result, formatScientific(result, precisionDigits));
    },
  },
  fact: {
    name: 'fact',
    label: 'n!',
    description: 'Factorial.',
    category: 'combinatorics',
    args: 1,
    evaluate: ([value], _angle, precisionDigits) => {
      if (value === undefined) return syntax('fact expects one argument.', 'Pass a single value.');
      return factorial(value, precisionDigits);
    },
  },
  nPr: {
    name: 'nPr',
    label: 'nPr',
    description: 'Number of permutations.',
    category: 'combinatorics',
    args: 2,
    evaluate: ([n, k], _angle, precisionDigits) => {
      if (n === undefined || k === undefined) {
        return syntax('nPr expects two arguments.', 'Pass n and k.');
      }
      return permutations(n, k, precisionDigits);
    },
  },
  nCr: {
    name: 'nCr',
    label: 'nCr',
    description: 'Number of combinations.',
    category: 'combinatorics',
    args: 2,
    evaluate: ([n, k], _angle, precisionDigits) => {
      if (n === undefined || k === undefined) {
        return syntax('nCr expects two arguments.', 'Pass n and k.');
      }
      return combinations(n, k, precisionDigits);
    },
  },
};

export const SCIENTIFIC_CONSTANTS: Record<string, ScientificValue> = {
  pi: Math.PI,
  e: Math.E,
};

export function listScientificFunctions(): readonly ScientificFunction[] {
  return Object.values(SCIENTIFIC_FUNCTIONS);
}

export function formatBasic(value: number): string {
  return formatScientific(value);
}