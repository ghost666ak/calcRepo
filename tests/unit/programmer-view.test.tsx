import { renderWithProviders as render } from '../../src/test/renderWithProviders';
import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppShell } from '../../src/app/AppShell';

describe('ProgrammerView', () => {
  it('renders initial state with hex output', async () => {
    const user = userEvent.setup();
    render(<AppShell />);
    await user.click(screen.getByRole('tab', { name: /programmer/i }));
    const output = await screen.findByTestId('programmer-output');
    expect(output).toBeInTheDocument();
  });

  it('evaluates 0xFF & 0x0F to 0x0F', async () => {
    const user = userEvent.setup();
    render(<AppShell />);
    await user.click(screen.getByRole('tab', { name: /programmer/i }));
    const input = await screen.findByTestId('programmer-input');
    await user.clear(input);
    await user.type(input, '0xFF & 0x0F');
    const hex = await screen.findByTestId('programmer-hex');
    expect(hex).toHaveTextContent('f');
    const bin = await screen.findByTestId('programmer-bin');
    expect(bin).toHaveTextContent('1111');
  });

  it('surfaces overflow flag when signed 8-bit wraps', async () => {
    const user = userEvent.setup();
    render(<AppShell />);
    await user.click(screen.getByRole('tab', { name: /programmer/i }));
    const widths = await screen.findByRole('group', { name: /programmer settings/i });
    await user.click(within(widths).getByLabelText('8-bit'));
    await user.click(within(widths).getByLabelText('signed'));
    const input = await screen.findByTestId('programmer-input');
    await user.clear(input);
    await user.type(input, '127 + 1');
    const dec = await screen.findByTestId('programmer-dec');
    expect(dec).toHaveTextContent('-128');
    const flags = await screen.findByRole('list', { name: /status flags/i });
    expect(within(flags).getByText(/overflow: 1/)).toBeInTheDocument();
  });

  it('rejects fractional operands', async () => {
    const user = userEvent.setup();
    render(<AppShell />);
    await user.click(screen.getByRole('tab', { name: /programmer/i }));
    const input = await screen.findByTestId('programmer-input');
    await user.clear(input);
    await user.type(input, '0.5 & 0xFF');
    const error = await screen.findByTestId('programmer-error');
    expect(error.textContent).toMatch(/fractional/i);
  });
});