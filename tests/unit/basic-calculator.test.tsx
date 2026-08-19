import { renderWithProviders as render } from '../../src/test/renderWithProviders';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BasicView } from '../../src/features/basic/BasicView';

describe('BasicView interactions', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('computes 2 + 3 * 4 with correct precedence', async () => {
    const user = userEvent.setup();
    render(<BasicView />);
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: '+' }));
    await user.click(screen.getByRole('button', { name: '3' }));
    await user.click(screen.getByRole('button', { name: '×' }));
    await user.click(screen.getByRole('button', { name: '4' }));
    await user.click(screen.getByTestId('key-equals'));
    expect(screen.getByTestId('display-value')).toHaveTextContent('14');
  });

  it('reports a division-by-zero error and allows recovery', async () => {
    const user = userEvent.setup();
    render(<BasicView />);
    await user.click(screen.getByRole('button', { name: '5' }));
    await user.click(screen.getByRole('button', { name: '÷' }));
    await user.click(screen.getByRole('button', { name: '0' }));
    await user.click(screen.getByTestId('key-equals'));
    expect(screen.getByTestId('display-error')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'C' }));
    expect(screen.getByTestId('display-value')).toHaveTextContent('0');
  });

  it('handles keyboard entry', async () => {
    const user = userEvent.setup();
    render(<BasicView />);
    await user.keyboard('(2+3)*4');
    await user.keyboard('{Enter}');
    expect(screen.getByTestId('display-value')).toHaveTextContent('20');
  });

  it('replaces the trailing operator instead of duplicating it', async () => {
    const user = userEvent.setup();
    render(<BasicView />);
    await user.click(screen.getByRole('button', { name: '7' }));
    await user.click(screen.getByRole('button', { name: '+' }));
    await user.click(screen.getByRole('button', { name: '−' }));
    expect(screen.getByTestId('display-expression')).toHaveTextContent('7−');
  });

  it('starts a fresh calculation when a digit is pressed after = (default)', async () => {
    const user = userEvent.setup();
    render(<BasicView />);
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: '+' }));
    await user.click(screen.getByRole('button', { name: '3' }));
    await user.click(screen.getByTestId('key-equals'));
    expect(screen.getByTestId('display-value')).toHaveTextContent('5');
    // The post-= digit resets; "5" should now be a fresh "5", not "2+35".
    await user.click(screen.getByRole('button', { name: '5' }));
    expect(screen.getByTestId('display-expression')).toHaveTextContent('5');
    await user.click(screen.getByTestId('key-equals'));
    expect(screen.getByTestId('display-value')).toHaveTextContent('5');
  });

  it('starts a fresh calculation when a decimal is pressed after = (default)', async () => {
    const user = userEvent.setup();
    render(<BasicView />);
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: '+' }));
    await user.click(screen.getByRole('button', { name: '3' }));
    await user.click(screen.getByTestId('key-equals'));
    expect(screen.getByTestId('display-value')).toHaveTextContent('5');
    await user.click(screen.getByRole('button', { name: '.' }));
    await user.click(screen.getByRole('button', { name: '5' }));
    expect(screen.getByTestId('display-expression')).toHaveTextContent('.5');
    await user.click(screen.getByTestId('key-equals'));
    expect(screen.getByTestId('display-value')).toHaveTextContent('0.5');
  });

  it('keeps appending when clearAfterEquals is off', async () => {
    // Opt out of the new behaviour via storage so the hook reads the preference on mount.
    window.localStorage.setItem(
      'calcRepo.preferences.v1',
      JSON.stringify({ clearAfterEquals: false }),
    );
    const user = userEvent.setup();
    render(<BasicView />);
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: '+' }));
    await user.click(screen.getByRole('button', { name: '3' }));
    await user.click(screen.getByTestId('key-equals'));
    expect(screen.getByTestId('display-value')).toHaveTextContent('5');
    // Legacy behaviour: the next digit appends to the old expression.
    await user.click(screen.getByRole('button', { name: '5' }));
    expect(screen.getByTestId('display-expression')).toHaveTextContent('2+35');
    await user.click(screen.getByTestId('key-equals'));
    expect(screen.getByTestId('display-value')).toHaveTextContent('37');
  });

  it('preserves the trailing operator when "(" is typed next', async () => {
    const user = userEvent.setup();
    render(<BasicView />);
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: '−' }));
    await user.click(screen.getByRole('button', { name: '(' }));
    await user.keyboard('3+5)');
    await user.click(screen.getByTestId('key-equals'));
    expect(screen.getByTestId('display-value')).toHaveTextContent('-6');
  });

  it('repeats the last result by adding it to itself', async () => {
    const user = userEvent.setup();
    render(<BasicView />);
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: '+' }));
    await user.click(screen.getByRole('button', { name: '3' }));
    await user.click(screen.getByTestId('key-equals'));
    expect(screen.getByTestId('display-value')).toHaveTextContent('5');
    await act(async () => {
      await user.click(screen.getByTestId('repeat-button'));
    });
    expect(screen.getByTestId('display-value')).toHaveTextContent('10');
  });

  it('auto-corrects a missing ")" and reports what it did', async () => {
    const user = userEvent.setup();
    render(<BasicView />);
    await user.keyboard('(2+3');
    await user.keyboard('{Enter}');
    expect(screen.getByTestId('display-value')).toHaveTextContent('5');
    // The original (corrected) expression stays visible above the answer.
    expect(screen.getByTestId('display-expression')).toHaveTextContent('(2+3)');
    const error = screen.getByTestId('display-error');
    expect(error.textContent ?? '').toMatch(/auto-fixed/i);
    expect(error.textContent ?? '').toMatch(/missing "\)"/i);
  });

  it('keeps the original expression visible after a successful equals', async () => {
    const user = userEvent.setup();
    render(<BasicView />);
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: '+' }));
    await user.click(screen.getByRole('button', { name: '3' }));
    await user.click(screen.getByTestId('key-equals'));
    expect(screen.getByTestId('display-value')).toHaveTextContent('5');
    // The expression above should still be the user's input.
    expect(screen.getByTestId('display-expression')).toHaveTextContent('2+3');
  });

  it('renders * as × in the expression display without changing storage', async () => {
    const user = userEvent.setup();
    render(<BasicView />);
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: '×' }));
    await user.click(screen.getByRole('button', { name: '3' }));
    // The display should render the multiplication sign as ×.
    expect(screen.getByTestId('display-expression')).toHaveTextContent('2×3');
  });

  it('highlights the offending character when the parser rejects input', async () => {
    const user = userEvent.setup();
    render(<BasicView />);
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '+' }));
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: '+' }));
    await user.click(screen.getByTestId('key-equals'));
    const expression = screen.getByTestId('display-expression');
    const errorSpan = expression.querySelector('[data-error="true"]');
    expect(errorSpan).not.toBeNull();
    // The trailing "+" should be highlighted.
    expect(errorSpan?.textContent).toBe('+');
  });

  it('surfaces an inline error when a second decimal is pressed in the same number', async () => {
    const user = userEvent.setup();
    render(<BasicView />);
    await user.click(screen.getByRole('button', { name: '5' }));
    await user.click(screen.getByRole('button', { name: '.' }));
    await user.click(screen.getByRole('button', { name: '5' }));
    // Pressing "." a second time must surface an error — silently dropping
    // the keystroke was hiding a real typo.
    await user.click(screen.getByRole('button', { name: '.' }));
    const error = screen.getByTestId('display-error');
    expect(error).toHaveTextContent(/decimal point/i);
    // Expression state remains the previous valid value, NOT a truncated
    // "5.5." nor a silently-modified "5.55".
    expect(screen.getByTestId('display-expression')).toHaveTextContent('5.5');
  });

  it('surfaces an inline error when a letter is typed instead of dropping it', async () => {
    const user = userEvent.setup();
    render(<BasicView />);
    await user.keyboard('5');
    await user.keyboard('s');
    const error = screen.getByTestId('display-error');
    expect(error).toHaveTextContent(/Unexpected character "s"/i);
    // Expression state is unchanged.
    expect(screen.getByTestId('display-expression')).toHaveTextContent('5');
  });

  it('surfaces an inline error when a comma is typed', async () => {
    const user = userEvent.setup();
    render(<BasicView />);
    await user.keyboard('5');
    await user.keyboard(',');
    const error = screen.getByTestId('display-error');
    expect(error).toHaveTextContent(/Unexpected character ","/i);
  });

  it('computes factorial via the keyboard in basic mode', async () => {
    const user = userEvent.setup();
    render(<BasicView />);
    await user.keyboard('5');
    await user.keyboard('!');
    await user.keyboard('{Enter}');
    expect(screen.getByTestId('display-value')).toHaveTextContent('120');
  });

  it('clears the inline error on the next valid press', async () => {
    const user = userEvent.setup();
    render(<BasicView />);
    await user.keyboard('5');
    await user.keyboard('s');
    expect(screen.getByTestId('display-error')).toBeInTheDocument();
    // Any valid press should clear the error.
    await user.click(screen.getByRole('button', { name: '2' }));
    expect(screen.queryByTestId('display-error')).not.toBeInTheDocument();
  });

  it('renders long answers as expandable toggle buttons in the inline history', async () => {
    const user = userEvent.setup();
    render(<BasicView />);
    // Mult two big numbers — result is >24 digits and triggers the toggle.
    for (const ch of '999999999999999*123456789012345') await user.keyboard(ch);
    await user.keyboard('{Enter}');
    // Open the <details> so the entry list renders.
    await user.click(screen.getByText(/History/));
    const toggle = await screen.findByTestId('history-answer-toggle');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveClass('history-answer--truncated');
    await user.click(toggle);
    expect(toggle).toHaveClass('history-answer--expanded');
  });
});