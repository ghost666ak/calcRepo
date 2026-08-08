import { renderWithProviders as render } from '../../src/test/renderWithProviders';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToolsView } from '../../src/features/tools/ToolsView';

describe('ToolsView', () => {
  it('renders the bit inspector tab by default', () => {
    render(<ToolsView />);
    expect(screen.getByTestId('tool-bits')).toBeInTheDocument();
  });

  it('switches tabs and renders the unicode tool', async () => {
    const user = userEvent.setup();
    render(<ToolsView />);
    await user.click(screen.getByRole('tab', { name: 'Unicode & UTF-8' }));
    expect(screen.getByTestId('tool-unicode')).toBeInTheDocument();
  });

  it('exposes an IEEE-754 inspector tab', async () => {
    const user = userEvent.setup();
    render(<ToolsView />);
    await user.click(screen.getByRole('tab', { name: 'IEEE-754' }));
    expect(screen.getByTestId('tool-ieee754')).toBeInTheDocument();
  });

  it('exposes a bytes converter tab', async () => {
    const user = userEvent.setup();
    render(<ToolsView />);
    await user.click(screen.getByRole('tab', { name: 'Bytes' }));
    expect(screen.getByTestId('tool-bytes')).toBeInTheDocument();
  });

  it('exposes a timestamp converter tab', async () => {
    const user = userEvent.setup();
    render(<ToolsView />);
    await user.click(screen.getByRole('tab', { name: 'Timestamp' }));
    expect(screen.getByTestId('tool-timestamp')).toBeInTheDocument();
  });
});
