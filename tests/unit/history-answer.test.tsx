import { renderWithProviders as render } from '../../src/test/renderWithProviders';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { HistoryAnswer } from '../../src/components/HistoryAnswer';

describe('HistoryAnswer', () => {
  it('renders short results as a non-interactive span', () => {
    render(<HistoryAnswer value="42" />);
    const span = screen.getByText('42');
    expect(span.tagName).toBe('SPAN');
    expect(span).not.toHaveAttribute('aria-expanded');
    expect(screen.queryByTestId('history-answer-toggle')).not.toBeInTheDocument();
  });

  it('truncates long results into a clickable button', () => {
    render(<HistoryAnswer value="123456789012345678901234567890" />);
    const button = screen.getByTestId('history-answer-toggle');
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveClass('history-answer--truncated');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveTextContent('123456789012345678901234567890');
  });

  it('expands and collapses on click', async () => {
    const user = userEvent.setup();
    render(<HistoryAnswer value="123456789012345678901234567890" />);
    const button = screen.getByTestId('history-answer-toggle');
    expect(button).toHaveClass('history-answer--truncated');
    await user.click(button);
    expect(button).toHaveClass('history-answer--expanded');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    await user.click(button);
    expect(button).toHaveClass('history-answer--truncated');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('respects a custom truncate threshold', () => {
    render(<HistoryAnswer value="hello world" truncateThreshold={3} />);
    // 11 chars > 3, so it should render as a button.
    expect(screen.getByTestId('history-answer-toggle')).toBeInTheDocument();
  });
});
