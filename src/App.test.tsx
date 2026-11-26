import { render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from './App';
import { createAppStore } from './store/store';

function renderAtRoute(initialEntry: string) {
  const testStore = createAppStore();
  return render(
    <Provider store={testStore}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AppRoutes />
      </MemoryRouter>
    </Provider>,
  );
}

describe('App foundation routing and layout', () => {
  it('renders Expenses dashboard at "/" and marks Expenses nav link as active', () => {
    renderAtRoute('/');

    expect(screen.getByRole('heading', { level: 1, name: 'Expenses' })).toBeInTheDocument();
    expect(screen.getByText(/5 trip members · 6 recorded expenses/)).toBeInTheDocument();

    const primaryNav = screen.getByRole('navigation', { name: 'Primary' });
    const expensesNavLink = within(primaryNav).getByRole('link', { name: 'Expenses' });
    const addExpenseNavLink = within(primaryNav).getByRole('link', { name: 'Add expense' });

    expect(expensesNavLink).toHaveAttribute('aria-current', 'page');
    expect(addExpenseNavLink).not.toHaveAttribute('aria-current');
  });

  it('renders Add expense page at "/expenses/new" and marks Add expense nav link as active', () => {
    renderAtRoute('/expenses/new');

    expect(screen.getByRole('heading', { level: 1, name: 'Add expense' })).toBeInTheDocument();

    const primaryNav = screen.getByRole('navigation', { name: 'Primary' });
    expect(within(primaryNav).getByRole('link', { name: 'Add expense' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('renders "Page not found" with a link back to Expenses for unknown routes', () => {
    renderAtRoute('/some/unknown/route');

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Expenses' })).toHaveAttribute('href', '/');
  });
});
