import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppShell } from '../../src/app/AppShell';

describe('BaseView', () => {
  it('renders initial state with default decimal/hex output', async () => {
    render(<AppShell />);
    await userEvent.click(screen.getByRole('tab', { name: /base/i }));
    const output = await screen.findByTestId('base-output');
    expect(output).toHaveTextContent('0');
  });

  it('converts 255 from decimal to hex', async () => {
    const user = userEvent.setup();
    render(<AppShell />);
    await user.click(screen.getByRole('tab', { name: /base/i }));
    const input = await screen.findByTestId('base-input');
    await user.clear(input);
    await user.type(input, '255');
    const output = await screen.findByTestId('base-output');
    expect(output).toHaveTextContent('ff');
  });

  it('surfaces an error for invalid digits', async () => {
    const user = userEvent.setup();
    render(<AppShell />);
    await user.click(screen.getByRole('tab', { name: /base/i }));
    const sourceGroup = await screen.findByRole('group', { name: /source base presets/i });
    await user.click(within(sourceGroup).getByRole('button', { name: 'BIN' }));
    const input = await screen.findByTestId('base-input');
    await user.clear(input);
    await user.type(input, '3');
    const error = await screen.findByTestId('base-error');
    expect(error).toHaveTextContent(/not valid/i);
  });

  it('swaps source and target bases', async () => {
    const user = userEvent.setup();
    render(<AppShell />);
    await user.click(screen.getByRole('tab', { name: /base/i }));
    const input = await screen.findByTestId('base-input');
    await user.clear(input);
    await user.type(input, '255');
    const target = await screen.findByTestId('base-target');
    expect(target).toHaveValue(16);
    const source = await screen.findByTestId('base-source');
    expect(source).toHaveValue(10);
    await user.click(screen.getByTestId('base-swap'));
    expect(await screen.findByTestId('base-source')).toHaveValue(16);
    expect(await screen.findByTestId('base-target')).toHaveValue(10);
  });
});