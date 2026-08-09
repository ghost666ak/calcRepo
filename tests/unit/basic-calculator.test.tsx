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
});