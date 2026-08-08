import { renderWithProviders as render } from '../../src/test/renderWithProviders';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScientificView } from '../../src/features/scientific/ScientificView';

describe('ScientificView interactions', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('switches angle units and reflects them in calculations', async () => {
    const user = userEvent.setup();
    render(<ScientificView />);
    await user.click(screen.getByRole('radio', { name: /Degrees/i }));
    await user.keyboard('sin(30)');
    await user.click(screen.getByTestId('key-equals'));
    expect(screen.getByTestId('display-value')).toHaveTextContent('0.5');
  });

  it('reports domain errors when invalid', async () => {
    const user = userEvent.setup();
    render(<ScientificView />);
    await user.keyboard('sqrt(-1)');
    await user.click(screen.getByTestId('key-equals'));
    expect(screen.getByTestId('display-error')).toBeInTheDocument();
  });

  it('maintains memory registers across interactions', async () => {
    const user = userEvent.setup();
    render(<ScientificView />);
    await user.keyboard('5');
    await user.click(screen.getByRole('button', { name: 'M+' }));
    expect(screen.getByText('Memory: 5')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'C' }));
    await user.click(screen.getByRole('button', { name: 'MR' }));
    expect(screen.getByTestId('display-expression')).toHaveTextContent('5');
  });

  it('appends multi-char function tokens like sin( when the button is clicked', async () => {
    const user = userEvent.setup();
    render(<ScientificView />);
    // The default angle unit is RAD, but sin(30°) only reads as 0.5 in DEG.
    await user.click(screen.getByRole('radio', { name: /Degrees/i }));
    await user.click(screen.getByRole('button', { name: 'sin' }));
    await user.keyboard('30)');
    await user.click(screen.getByTestId('key-equals'));
    expect(screen.getByTestId('display-value')).toHaveTextContent('0.5');
  });

  it('appends pi and e constants from their dedicated buttons', async () => {
    const user = userEvent.setup();
    render(<ScientificView />);
    await user.click(screen.getByRole('button', { name: 'π' }));
    await user.click(screen.getByRole('button', { name: '×' }));
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByTestId('key-equals'));
    expect(screen.getByTestId('display-value')).toHaveTextContent('6.28');
  });

  it('evaluates 8! as 40320', async () => {
    const user = userEvent.setup();
    render(<ScientificView />);
    await user.click(screen.getByRole('button', { name: '8' }));
    await user.click(screen.getByRole('button', { name: '!' }));
    await user.click(screen.getByTestId('key-equals'));
    // Scientific formatter pads to 12 decimals.
    expect(screen.getByTestId('display-value')).toHaveTextContent('40320.000000000000');
  });

  it('supports nCr via function button', async () => {
    const user = userEvent.setup();
    render(<ScientificView />);
    await user.click(screen.getByRole('button', { name: 'nCr' }));
    await user.keyboard('5,2)');
    await user.click(screen.getByTestId('key-equals'));
    expect(screen.getByTestId('display-value')).toHaveTextContent('10');
  });

  // Sweep every scientific function button through the UI to make sure
  // multi-char tokens actually reach the evaluator. Each case clicks the
  // function button (which appends "<name>("), types the argument + ")",
  // then presses =.
  describe('every scientific function button evaluates via the UI', () => {
    const cases: ReadonlyArray<{ name: RegExp | string; type: string; expectMatch: RegExp | string }> = [
      { name: '√', type: '4)', expectMatch: '2.000000000000' },
      { name: '∛', type: '8)', expectMatch: '2.000000000000' },
      { name: 'ln', type: '1)', expectMatch: '0.000000000000' },
      { name: /log₁₀/, type: '100)', expectMatch: '2.000000000000' },
      { name: /log₂/, type: '8)', expectMatch: '3.000000000000' },
      { name: 'eˣ', type: '1)', expectMatch: /2\.7/ }, // e^1 ≈ 2.718
      { name: 'xʸ', type: '2,3)', expectMatch: '8.000000000000' },
      { name: 'sin', type: '0)', expectMatch: '0.000000000000' },
      { name: 'cos', type: '0)', expectMatch: '1.000000000000' },
      { name: 'tan', type: '0)', expectMatch: '0.000000000000' },
      { name: /sin⁻¹/, type: '1)', expectMatch: /1\.57/ }, // π/2 ≈ 1.5708
      { name: /cos⁻¹/, type: '1)', expectMatch: '0.000000000000' },
      { name: /tan⁻¹/, type: '0)', expectMatch: '0.000000000000' },
      { name: 'sinh', type: '0)', expectMatch: '0.000000000000' },
      { name: 'cosh', type: '0)', expectMatch: '1.000000000000' },
      { name: 'tanh', type: '0)', expectMatch: '0.000000000000' },
      { name: 'n!', type: '5)', expectMatch: '120.000000000000' },
      { name: 'nPr', type: '5,2)', expectMatch: '20.000000000000' },
      { name: 'nCr', type: '5,2)', expectMatch: '10.000000000000' },
    ];

    for (const c of cases) {
      it(`evaluates ${typeof c.name === 'string' ? c.name : c.name.source} through the keypad`, async () => {
        const user = userEvent.setup();
        render(<ScientificView />);
        await user.click(screen.getByRole('button', { name: c.name }));
        await user.keyboard(c.type);
        await user.click(screen.getByTestId('key-equals'));
        expect(screen.getByTestId('display-value')).toHaveTextContent(c.expectMatch);
      });
    }
  });
});