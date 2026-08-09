import { renderWithProviders as render } from '../../src/test/renderWithProviders';
import { describe, expect, it } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
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
    expect(target).toHaveValue('16');
    const source = await screen.findByTestId('base-source');
    expect(source).toHaveValue('10');
    await user.click(screen.getByTestId('base-swap'));
    expect(await screen.findByTestId('base-source')).toHaveValue('16');
    expect(await screen.findByTestId('base-target')).toHaveValue('10');
  });
});

describe('BaseView — source/target base input UX', () => {
  it('accepts a valid integer and uses it for conversion', async () => {
    const user = userEvent.setup();
    render(<AppShell />);
    await user.click(screen.getByRole('tab', { name: /base/i }));
    const source = await screen.findByTestId('base-source');
    const input = await screen.findByTestId('base-input');
    const output = await screen.findByTestId('base-output');
    await user.clear(source);
    await user.type(source, '7');
    expect(source).toHaveValue('7');
    // 20 in base 7 is 14 (2*7 + 0); 14 in hex is "e". Confirms the typed
    // value was actually used (not the previous default of 10).
    await user.clear(input);
    await user.type(input, '20');
    expect(output).toHaveTextContent(/e/);
    expect(screen.queryByTestId('base-source-error')).not.toBeInTheDocument();
  });

  it('keeps the user-typed text visible when out of range and surfaces an error', async () => {
    const user = userEvent.setup();
    render(<AppShell />);
    await user.click(screen.getByRole('tab', { name: /base/i }));
    const source = await screen.findByTestId('base-source');
    await user.clear(source);
    await user.type(source, '40');
    // Input reflects what the user typed — not silently snapped back.
    expect(source).toHaveValue('40');
    expect(source).toHaveAttribute('aria-invalid', 'true');
    const error = await screen.findByTestId('base-source-error');
    expect(error).toHaveTextContent(/2.*36/);
  });

  it('treats a decimal as invalid and shows the same error', async () => {
    const user = userEvent.setup();
    render(<AppShell />);
    await user.click(screen.getByRole('tab', { name: /base/i }));
    const source = await screen.findByTestId('base-source');
    // Simulate paste / programmatic change because the input has pattern=[0-9]*.
    fireEvent.change(source, { target: { value: '2.5' } });
    expect(source).toHaveValue('2.5');
    expect(source).toHaveAttribute('aria-invalid', 'true');
    expect(await screen.findByTestId('base-source-error')).toBeInTheDocument();
  });

  it('treats an empty input as no error and keeps the previous base', async () => {
    const user = userEvent.setup();
    render(<AppShell />);
    await user.click(screen.getByRole('tab', { name: /base/i }));
    const source = await screen.findByTestId('base-source');
    await user.clear(source);
    expect(source).toHaveValue('');
    expect(source).not.toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByTestId('base-source-error')).not.toBeInTheDocument();
  });

  it('clears the error as soon as the user types a valid value', async () => {
    const user = userEvent.setup();
    render(<AppShell />);
    await user.click(screen.getByRole('tab', { name: /base/i }));
    const source = await screen.findByTestId('base-source');
    await user.clear(source);
    await user.type(source, '40');
    expect(source).toHaveAttribute('aria-invalid', 'true');
    // Now correct it.
    await user.clear(source);
    await user.type(source, '8');
    expect(source).toHaveValue('8');
    expect(source).not.toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByTestId('base-source-error')).not.toBeInTheDocument();
  });
});