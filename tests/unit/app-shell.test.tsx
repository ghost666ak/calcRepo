import { renderWithProviders as render } from '../../src/test/renderWithProviders';
import { screen } from '@testing-library/react';
import { App } from '../../src/app/App';

describe('App shell', () => {
  it('renders the calculator with initial zero display', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /calcRepo/i })).toBeInTheDocument();
    expect(screen.getByTestId('display-value')).toHaveTextContent('0');
  });

  it('exposes the configured calculator modes', () => {
    render(<App />);
    const tablist = screen.getByRole('tablist', { name: /calculator mode/i });
    expect(tablist).toBeInTheDocument();
    for (const label of ['Basic', 'Scientific', 'Base', 'Programmer', 'Tools']) {
      expect(screen.getByRole('tab', { name: label })).toBeInTheDocument();
    }
  });
});