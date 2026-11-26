import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { getSampleTripData } from '../domain/sampleData';
import { createAppStore } from '../store/store';
import { ExpensesPage } from './ExpensesPage';

function renderDashboard(customExpenses?: ReturnType<typeof getSampleTripData>['expenses']) {
  const sample = getSampleTripData();
  const testStore = createAppStore(
    customExpenses
      ? { trip: { members: sample.members, expenses: customExpenses } }
      : undefined,
  );

  return render(
    <Provider store={testStore}>
      <MemoryRouter>
        <ExpensesPage />
      </MemoryRouter>
    </Provider>,
  );
}

describe('ExpensesPage dashboard', () => {
  it('renders Goa Getaway header, summary cards, and all 5 member balances', () => {
    renderDashboard();

    expect(screen.getByText('Goa Getaway')).toBeInTheDocument();

    const summaryRegion = screen.getByRole('region', { name: 'Trip summary' });
    expect(within(summaryRegion).getByText('₹42,249.99')).toBeInTheDocument();
    expect(within(summaryRegion).getAllByText('₹19,108.28')).toHaveLength(2);
    expect(within(summaryRegion).getByText('6')).toBeInTheDocument();

    const balancesSection = screen.getByRole('region', { name: 'Member balances' });
    expect(within(balancesSection).getByText('Aarav')).toBeInTheDocument();
    expect(within(balancesSection).getByText('gets back ₹18,554.20')).toBeInTheDocument();
    expect(within(balancesSection).getByText('Diya')).toBeInTheDocument();
    expect(within(balancesSection).getByText('owes ₹3,695.78')).toBeInTheDocument();
    expect(within(balancesSection).getByText('Kabir')).toBeInTheDocument();
    expect(within(balancesSection).getByText('gets back ₹554.08')).toBeInTheDocument();
    expect(within(balancesSection).getByText('Meera')).toBeInTheDocument();
    expect(within(balancesSection).getByText('owes ₹8,112.50')).toBeInTheDocument();
    expect(within(balancesSection).getByText('Rohan')).toBeInTheDocument();
    expect(within(balancesSection).getByText('owes ₹7,300.00')).toBeInTheDocument();
  });

  it('sorts expense history newest date first and displays split summaries', () => {
    renderDashboard();

    const rows = screen.getAllByRole('row');
    // Header row + 6 expense rows
    expect(rows).toHaveLength(7);

    const firstRow = rows[1];
    const secondRow = rows[2];
    if (!firstRow || !secondRow) {
      throw new Error('Expected at least two expense rows.');
    }

    // Row 1 should be 2026-03-15 Airport cab
    expect(within(firstRow).getByRole('rowheader', { name: 'Airport cab' })).toBeInTheDocument();
    expect(within(firstRow).getByText('15 Mar 2026')).toBeInTheDocument();
    expect(within(firstRow).getByText('₹1,499.99')).toBeInTheDocument();
    expect(within(firstRow).getByText('Percent, 3 people')).toBeInTheDocument();

    // Row 2 should be 2026-03-14 Groceries
    expect(within(secondRow).getByRole('rowheader', { name: 'Groceries' })).toBeInTheDocument();
    expect(within(secondRow).getByText('Equally, 3 people')).toBeInTheDocument();
  });

  it('filters expenses by category, updates filtered total, and shows empty state when none match', async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole('button', { name: 'Food' }));

    expect(screen.getByText(/Showing/i).textContent).toContain('2 expenses');
    expect(screen.getByText(/Showing/i).textContent).toContain('₹4,250.00');
    expect(screen.getByRole('rowheader', { name: 'Groceries' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Beach shack dinner' })).toBeInTheDocument();
    expect(screen.queryByRole('rowheader', { name: 'Villa booking' })).not.toBeInTheDocument();

    // Filter to "Other" which has 0 expenses in sample data
    await user.click(screen.getByRole('button', { name: 'Other' }));
    expect(screen.getByText('No expenses in Other')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show all expenses' }));
    expect(screen.getByRole('rowheader', { name: 'Villa booking' })).toBeInTheDocument();
  });

  it('shows settled up balances and empty state when there are no expenses', () => {
    renderDashboard([]);

    expect(screen.getAllByText('settled up')).toHaveLength(5);
    expect(screen.getByText('No expenses recorded yet')).toBeInTheDocument();
  });
});
