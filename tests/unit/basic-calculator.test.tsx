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
    expect(screen.getByTestId("display-value")).toHaveValue('14');
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
    expect(screen.getByTestId("display-value")).toHaveValue('0');
  });

  it('handles keyboard entry', async () => {
    const user = userEvent.setup();
    render(<BasicView />);
    await user.keyboard('(2+3)*4');
    await user.keyboard('{Enter}');
    expect(screen.getByTestId("display-value")).toHaveValue('20');
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
    expect(screen.getByTestId("display-value")).toHaveValue('5');
    // The post-= digit resets; "5" should now be a fresh "5", not "2+35".
    await user.click(screen.getByRole('button', { name: '5' }));
    expect(screen.getByTestId('display-expression')).toHaveTextContent('5');
    await user.click(screen.getByTestId('key-equals'));
    expect(screen.getByTestId("display-value")).toHaveValue('5');
  });

  it('starts a fresh calculation when a decimal is pressed after = (default)', async () => {
    const user = userEvent.setup();
    render(<BasicView />);
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: '+' }));
    await user.click(screen.getByRole('button', { name: '3' }));
    await user.click(screen.getByTestId('key-equals'));
    expect(screen.getByTestId("display-value")).toHaveValue('5');
    await user.click(screen.getByRole('button', { name: '.' }));
    await user.click(screen.getByRole('button', { name: '5' }));
    expect(screen.getByTestId('display-expression')).toHaveTextContent('.5');
    await user.click(screen.getByTestId('key-equals'));
    expect(screen.getByTestId("display-value")).toHaveValue('0.5');
  });

  it('shows the full question on top and the continuation on bottom after = + binary', async () => {
    // After `100 × 50% = 50` the small "question" line should keep showing
    // the FULL question (with the new operator appended), while the big
    // "answer" line should continue from the result. e.g.
    //   `100 × 50%` = `50` × →  top `100×50%×`, bottom `50×`.
    const user = userEvent.setup();
    render(<BasicView />);
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '0' }));
    await user.click(screen.getByRole('button', { name: '0' }));
    await user.click(screen.getByRole('button', { name: '×' }));
    await user.click(screen.getByRole('button', { name: '5' }));
    await user.click(screen.getByRole('button', { name: '0' }));
    await user.click(screen.getByRole('button', { name: '%' }));
    await user.click(screen.getByTestId('key-equals'));
    expect(screen.getByTestId('display-value')).toHaveValue('50');
    await user.click(screen.getByRole('button', { name: '×' }));
    // Top: full canonical question including the new op.
    expect(screen.getByTestId('display-expression')).toHaveTextContent('100×50%×');
    // Bottom: continuation from the result.
    expect(screen.getByTestId('display-value')).toHaveValue('50×');
  });

  it('continues from the answer when + is pressed after = regardless of clearAfterEquals', async () => {
    // Even with clearAfterEquals off, a binary operator must start from the
    // answer — the preference only governs digits/decimals.
    window.localStorage.setItem(
      'calcRepo.preferences.v1',
      JSON.stringify({ clearAfterEquals: false }),
    );
    const user = userEvent.setup();
    render(<BasicView />);
    await user.click(screen.getByRole('button', { name: '7' }));
    await user.click(screen.getByRole('button', { name: '+' }));
    await user.click(screen.getByRole('button', { name: '8' }));
    await user.click(screen.getByTestId('key-equals'));
    expect(screen.getByTestId('display-value')).toHaveValue('15');
    await user.click(screen.getByRole('button', { name: '−' }));
    // Top: full question with new op; bottom: continuation.
    expect(screen.getByTestId('display-expression')).toHaveTextContent('7+8−');
    expect(screen.getByTestId('display-value')).toHaveValue('15−');
  });

  it('starts fresh when ( is pressed after = (paren is not a continuing operator)', async () => {
    const user = userEvent.setup();
    render(<BasicView />);
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: '+' }));
    await user.click(screen.getByRole('button', { name: '3' }));
    await user.click(screen.getByTestId('key-equals'));
    expect(screen.getByTestId("display-value")).toHaveValue('5');
    await user.click(screen.getByRole('button', { name: '(' }));
    // `(` is unary after `=` — should start a fresh sub-expression.
    expect(screen.getByTestId('display-expression')).toHaveTextContent('(');
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
    expect(screen.getByTestId("display-value")).toHaveValue('5');
    // Legacy behaviour: the next digit appends to the old expression.
    await user.click(screen.getByRole('button', { name: '5' }));
    expect(screen.getByTestId('display-expression')).toHaveTextContent('2+35');
    await user.click(screen.getByTestId('key-equals'));
    expect(screen.getByTestId("display-value")).toHaveValue('37');
  });

  it('preserves the trailing operator when "(" is typed next', async () => {
    const user = userEvent.setup();
    render(<BasicView />);
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: '−' }));
    await user.click(screen.getByRole('button', { name: '(' }));
    await user.keyboard('3+5)');
    await user.click(screen.getByTestId('key-equals'));
    expect(screen.getByTestId("display-value")).toHaveValue('−6');
  });

  it('repeats the last result by adding it to itself', async () => {
    const user = userEvent.setup();
    render(<BasicView />);
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: '+' }));
    await user.click(screen.getByRole('button', { name: '3' }));
    await user.click(screen.getByTestId('key-equals'));
    expect(screen.getByTestId("display-value")).toHaveValue('5');
    await act(async () => {
      await user.click(screen.getByTestId('repeat-button'));
    });
    expect(screen.getByTestId("display-value")).toHaveValue('10');
  });

  it('auto-corrects a missing ")" and reports what it did', async () => {
    const user = userEvent.setup();
    render(<BasicView />);
    await user.keyboard('(2+3');
    await user.keyboard('{Enter}');
    expect(screen.getByTestId("display-value")).toHaveValue('5');
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
    expect(screen.getByTestId("display-value")).toHaveValue('5');
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
    expect(screen.getByTestId("display-value")).toHaveValue('120');
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

  it('shows × (not *) in the inline history expression', async () => {
    const user = userEvent.setup();
    render(<BasicView />);
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: '×' }));
    await user.click(screen.getByRole('button', { name: '3' }));
    await user.click(screen.getByTestId('key-equals'));
    await user.click(screen.getByText(/History/));
    // The live display also renders `2×3` (the question stays visible after
    // =), so scope the lookup to the <code> inside the history list.
    const code = await screen.findByText('2×3', { selector: 'code' });
    expect(code).toBeInTheDocument();
    // Defensive: no stray raw * in the entry text.
    expect(code.textContent).not.toContain('*');
  });

  it('keeps the full question visible on top and the continuation on bottom across digits', async () => {
    // After `5+6=11` the small line should keep the full question as the
    // user keeps typing, while the big line runs from the result. e.g.
    //   `5 + 6 =` `+ 8` →  top `5+6+8`, bottom `11+8` →  `=` → bottom `19`.
    const user = userEvent.setup();
    render(<BasicView />);
    await user.click(screen.getByRole('button', { name: '5' }));
    await user.click(screen.getByRole('button', { name: '+' }));
    await user.click(screen.getByRole('button', { name: '6' }));
    await user.click(screen.getByTestId('key-equals'));
    expect(screen.getByTestId('display-value')).toHaveValue('11');
    await user.click(screen.getByRole('button', { name: '+' }));
    await user.click(screen.getByRole('button', { name: '8' }));
    expect(screen.getByTestId('display-expression')).toHaveTextContent('5+6+8');
    expect(screen.getByTestId('display-value')).toHaveValue('11+8');
    await user.click(screen.getByTestId('key-equals'));
    expect(screen.getByTestId('display-value')).toHaveValue('19');
  });

  it('auto-wraps the previous question in brackets when the new op binds tighter', async () => {
    // After `5+6=11`, pressing `*` would otherwise make the top line mean
    // `5 + (6 * x)` while the bottom means `(5+6) * x`. Auto-bracket keeps
    // them semantically equal. e.g.
    //   `5 + 6 =` `* 2` →  top `(5+6)*2`, bottom `11*2` →  `=` → bottom `22`.
    const user = userEvent.setup();
    render(<BasicView />);
    await user.click(screen.getByRole('button', { name: '5' }));
    await user.click(screen.getByRole('button', { name: '+' }));
    await user.click(screen.getByRole('button', { name: '6' }));
    await user.click(screen.getByTestId('key-equals'));
    await user.click(screen.getByRole('button', { name: '×' }));
    await user.click(screen.getByRole('button', { name: '2' }));
    expect(screen.getByTestId('display-expression')).toHaveTextContent('(5+6)×2');
    expect(screen.getByTestId('display-value')).toHaveValue('11×2');
    await user.click(screen.getByTestId('key-equals'));
    expect(screen.getByTestId('display-value')).toHaveValue('22');
  });

  it('does not wrap when the new op has the same or lower precedence', async () => {
    // `5*6=30`, then `+2`. Same or lower precedence → no bracket.
    // top `5×6+2`, bottom `30+2`, result `32`.
    const user = userEvent.setup();
    render(<BasicView />);
    await user.click(screen.getByRole('button', { name: '5' }));
    await user.click(screen.getByRole('button', { name: '×' }));
    await user.click(screen.getByRole('button', { name: '6' }));
    await user.click(screen.getByTestId('key-equals'));
    await user.click(screen.getByRole('button', { name: '+' }));
    await user.click(screen.getByRole('button', { name: '2' }));
    expect(screen.getByTestId('display-expression')).toHaveTextContent('5×6+2');
    expect(screen.getByTestId('display-value')).toHaveValue('30+2');
  });

  it('shows a movable cursor inside the editable result field', async () => {
    // The big display is now an <input> — verify the element has the
    // right shape and a cursor lands inside it on focus. jsdom does not
    // render a real caret, but it does track selection ranges, so we
    // assert the focused element + its value.
    const user = userEvent.setup();
    render(<BasicView />);
    const result = screen.getByTestId('display-value') as HTMLInputElement;
    expect(result.tagName).toBe('INPUT');
    expect(result.type).toBe('text');
    await user.click(result);
    expect(result).toHaveFocus();
    expect(result.value).toBe('0');
  });

  it('treats typographic operators typed into the result field as their ASCII counterparts', async () => {
    // On mobile the user can paste or type × ÷ − directly into the big
    // result field. The hook canonicalises them back to ASCII so the
    // evaluator still parses correctly.
    const user = userEvent.setup();
    render(<BasicView />);
    const result = screen.getByTestId('display-value') as HTMLInputElement;
    await user.click(result);
    await user.keyboard('5');
    await user.keyboard('×');
    await user.keyboard('6');
    // The visible value should be visualised (`5×6`); the underlying
    // canonical form feeds the next `=` correctly.
    expect(result.value).toBe('5×6');
    await user.keyboard('{Enter}');
    expect(screen.getByTestId('display-value')).toHaveValue('30');
  });
});