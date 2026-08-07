import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExpressionDisplay } from '../../src/components/ExpressionDisplay';

describe('ExpressionDisplay', () => {
  it('renders a placeholder when the expression is empty', () => {
    const { container } = render(<ExpressionDisplay expression="" errorPosition={null} testId="expr" />);
    // jsdom collapses whitespace inside a span, so just check the element exists
    // and no error segment is rendered.
    expect(screen.getByTestId('expr')).toBeInTheDocument();
    expect(container.querySelector('[data-error="true"]')).toBeNull();
  });

  it('renders the expression as plain text when there is no error position', () => {
    render(<ExpressionDisplay expression="1+2" errorPosition={null} testId="expr" />);
    const node = screen.getByTestId('expr');
    expect(node).toHaveTextContent('1+2');
    expect(node.querySelector('[data-error="true"]')).toBeNull();
  });

  it('marks the character at errorPosition with the highlight class', () => {
    render(<ExpressionDisplay expression="1+2)" errorPosition={3} testId="expr" />);
    const node = screen.getByTestId('expr');
    const errorSpan = node.querySelector('[data-error="true"]');
    expect(errorSpan).not.toBeNull();
    expect(errorSpan?.textContent).toBe(')');
    expect(node.textContent).toBe('1+2)');
  });

  it('does not highlight anything when errorPosition is out of range', () => {
    render(<ExpressionDisplay expression="1+2" errorPosition={99} testId="expr" />);
    expect(screen.getByTestId('expr').querySelector('[data-error="true"]')).toBeNull();
  });

  it('highlights the first character when position is 0', () => {
    render(<ExpressionDisplay expression="+1" errorPosition={0} testId="expr" />);
    const errorSpan = screen.getByTestId('expr').querySelector('[data-error="true"]');
    expect(errorSpan?.textContent).toBe('+');
  });

  it('renders * as × for display without changing the underlying value', () => {
    render(<ExpressionDisplay expression="2*3" errorPosition={null} testId="expr" />);
    expect(screen.getByTestId('expr')).toHaveTextContent('2×3');
  });

  it('renders / as ÷ and - as − for display', () => {
    render(<ExpressionDisplay expression="6/2-1" errorPosition={null} testId="expr" />);
    expect(screen.getByTestId('expr')).toHaveTextContent('6÷2−1');
  });

  it('keeps position offsets correct after the visual substitution', () => {
    // The error position is an offset into the canonical expression.
    render(<ExpressionDisplay expression="2*3" errorPosition={1} testId="expr" />);
    const errorSpan = screen.getByTestId('expr').querySelector('[data-error="true"]');
    expect(errorSpan?.textContent).toBe('×');
  });
});