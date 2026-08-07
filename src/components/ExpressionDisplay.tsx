interface Props {
  readonly expression: string;
  /** Character offset in the expression to highlight. `null` means no highlight. */
  readonly errorPosition: number | null;
  readonly testId?: string;
}

/**
 * Render an expression as a sequence of spans so the character at the error
 * position (if any) can carry a visual treatment. Falls back to a placeholder
 * when there is no expression.
 */
export function ExpressionDisplay({ expression, errorPosition, testId }: Props): JSX.Element {
  if (expression === '') {
    return (
      <span className="display__expression" data-testid={testId}>
        {' '}
      </span>
    );
  }
  const segments = splitAtPosition(expression, errorPosition);
  return (
    <span className="display__expression" data-testid={testId}>
      {segments.map((segment, index) => (
        <span
          key={index}
          className={segment.error ? 'display__expression-error' : undefined}
          data-error={segment.error ? 'true' : undefined}
        >
          {segment.text}
        </span>
      ))}
    </span>
  );
}

interface Segment {
  readonly text: string;
  readonly error: boolean;
}

function splitAtPosition(expression: string, position: number | null): readonly Segment[] {
  if (position === null || position < 0 || position >= expression.length) {
    return [{ text: expression, error: false }];
  }
  const before = expression.slice(0, position);
  const middle = expression.slice(position, position + 1);
  const after = expression.slice(position + 1);
  const segments: Segment[] = [];
  if (before !== '') segments.push({ text: before, error: false });
  segments.push({ text: middle, error: true });
  if (after !== '') segments.push({ text: after, error: false });
  return segments;
}