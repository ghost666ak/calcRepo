import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExpressionDisplay, visualiseExpression } from '../../src/components/ExpressionDisplay';

describe('ExpressionDisplay', () => {
  it('renders a placeholder when the expression is empty', () => {
    const { container } = render(
      <ExpressionDisplay expression="" errorPosition={null} errorUx="verbose" testId="expr" />,
    );
    expect(screen.getByTestId('expr')).toBeInTheDocument();
    expect(container.querySelector('[data-error="true"]')).toBeNull();
  });

  it('renders the expression as plain text when there is no error position', () => {
    render(
      <ExpressionDisplay expression="1+2" errorPosition={null} errorUx="verbose" testId="expr" />,
    );
    const node = screen.getByTestId('expr');
    expect(node).toHaveTextContent('1+2');
    expect(node.querySelector('[data-error="true"]')).toBeNull();
  });

  it('marks the character at errorPosition with the highlight class (verbose)', () => {
    render(
      <ExpressionDisplay expression="1+2)" errorPosition={3} errorUx="verbose" testId="expr" />,
    );
    const node = screen.getByTestId('expr');
    const errorSpan = node.querySelector('[data-error="true"]');
    expect(errorSpan).not.toBeNull();
    expect(errorSpan?.textContent).toBe(')');
    expect(node.textContent).toBe('1+2)');
  });

  it('still marks the highlight when errorUx is "highlight"', () => {
    render(
      <ExpressionDisplay expression="1+2)" errorPosition={3} errorUx="highlight" testId="expr" />,
    );
    const errorSpan = screen.getByTestId('expr').querySelector('[data-error="true"]');
    expect(errorSpan?.textContent).toBe(')');
  });

  it('drops the highlight when errorUx is "silent"', () => {
    render(
      <ExpressionDisplay expression="1+2)" errorPosition={3} errorUx="silent" testId="expr" />,
    );
    expect(screen.getByTestId('expr').querySelector('[data-error="true"]')).toBeNull();
    expect(screen.getByTestId('expr')).toHaveTextContent('1+2)');
  });

  it('does not highlight anything when errorPosition is out of range', () => {
    render(
      <ExpressionDisplay expression="1+2" errorPosition={99} errorUx="verbose" testId="expr" />,
    );
    expect(screen.getByTestId('expr').querySelector('[data-error="true"]')).toBeNull();
  });

  it('highlights the first character when position is 0', () => {
    render(
      <ExpressionDisplay expression="+1" errorPosition={0} errorUx="verbose" testId="expr" />,
    );
    const errorSpan = screen.getByTestId('expr').querySelector('[data-error="true"]');
    expect(errorSpan?.textContent).toBe('+');
  });

  it('renders * as × for display without changing the underlying value', () => {
    render(
      <ExpressionDisplay expression="2*3" errorPosition={null} errorUx="verbose" testId="expr" />,
    );
    expect(screen.getByTestId('expr')).toHaveTextContent('2×3');
  });

  it('renders / as ÷ and - as − for display', () => {
    render(
      <ExpressionDisplay expression="6/2-1" errorPosition={null} errorUx="verbose" testId="expr" />,
    );
    expect(screen.getByTestId('expr')).toHaveTextContent('6÷2−1');
  });

  it('keeps position offsets correct after the visual substitution', () => {
    render(
      <ExpressionDisplay expression="2*3" errorPosition={1} errorUx="verbose" testId="expr" />,
    );
    const errorSpan = screen.getByTestId('expr').querySelector('[data-error="true"]');
    expect(errorSpan?.textContent).toBe('×');
  });
});

describe('visualiseExpression', () => {
  it('converts * / - to × ÷ −', () => {
    expect(visualiseExpression('100*50%-6/3')).toBe('100×50%−6÷3');
  });
  it('leaves digits and other operators unchanged', () => {
    expect(visualiseExpression('2^3+1!')).toBe('2^3+1!');
  });
  it('handles the empty string', () => {
    expect(visualiseExpression('')).toBe('');
  });
});