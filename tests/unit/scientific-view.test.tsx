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
});