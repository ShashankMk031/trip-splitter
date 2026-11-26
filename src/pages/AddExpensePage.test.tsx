import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '../App';
import { createAppStore } from '../store/store';

function renderAppAtAddExpense() {
  const testStore = createAppStore();
  render(
    <Provider store={testStore}>
      <MemoryRouter initialEntries={['/expenses/new']}>
        <AppRoutes />
      </MemoryRouter>
    </Provider>,
  );
  return { testStore };
}

describe('AddExpensePage form validation and submission', () => {
  it('shows inline errors for every invalid field and does not save', async () => {
    const user = userEvent.setup();
    const { testStore } = renderAppAtAddExpense();
    const initialCount = testStore.getState().trip.expenses.length;

    await user.type(screen.getByLabelText(/Amount \(₹\)/), '-50');
    const dateInput = screen.getByLabelText(/Date/);
    await user.clear(dateInput);
    await user.type(dateInput, '2099-01-01');

    // Uncheck all equal participants
    for (const name of ['Aarav', 'Diya', 'Kabir', 'Meera', 'Rohan']) {
      await user.click(screen.getByLabelText(name));
    }

    await user.click(screen.getByRole('button', { name: /Save expense/i }));

    expect(screen.getByText('Description is required.')).toBeInTheDocument();
    expect(screen.getByText('Amount must be more than ₹0')).toBeInTheDocument();
    expect(screen.getByText('Please select who paid.')).toBeInTheDocument();
    expect(screen.getByText('Date cannot be in the future.')).toBeInTheDocument();
    expect(screen.getByText('Please select a category.')).toBeInTheDocument();
    expect(screen.getByText('Select at least one member for the split.')).toBeInTheDocument();

    expect(testStore.getState().trip.expenses).toHaveLength(initialCount);
    expect(screen.getByRole('heading', { level: 1, name: 'Add expense' })).toBeInTheDocument();
  });

  it('shows live equal shares, allows excluding payer, saves, and shows dashboard success banner', async () => {
    const user = userEvent.setup();
    const { testStore } = renderAppAtAddExpense();

    await user.type(screen.getByLabelText(/Description/), 'Ferry tickets');
    await user.type(screen.getByLabelText(/Amount \(₹\)/), '100');
    await user.selectOptions(screen.getByLabelText(/Paid by/), 'm1');
    await user.selectOptions(screen.getByLabelText(/Category/), 'Travel');

    // Exclude Aarav (m1) and Rohan (m5) so 3 people split ₹100
    await user.click(screen.getByLabelText('Aarav'));
    await user.click(screen.getByLabelText('Rohan'));

    expect(screen.getByText('₹33.34')).toBeInTheDocument();
    expect(screen.getAllByText('₹33.33')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: /Save ₹100.00/i }));

    expect(screen.getByRole('heading', { level: 1, name: 'Expenses' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Added "Ferry tickets" (₹100.00).');
    expect(screen.getByRole('rowheader', { name: 'Ferry tickets' })).toBeInTheDocument();
    expect(testStore.getState().trip.expenses).toHaveLength(7);
  });

  it('supports exact split live remainder feedback and valid submission', async () => {
    const user = userEvent.setup();
    const { testStore } = renderAppAtAddExpense();

    await user.type(screen.getByLabelText(/Description/), 'Kayaking');
    await user.type(screen.getByLabelText(/Amount \(₹\)/), '100');
    await user.selectOptions(screen.getByLabelText(/Paid by/), 'm2');
    await user.selectOptions(screen.getByLabelText(/Category/), 'Activities');
    await user.click(screen.getByRole('radio', { name: 'Exact amounts' }));

    await user.type(screen.getByLabelText('Aarav (₹)'), '50');
    await user.type(screen.getByLabelText('Diya (₹)'), '37.50');
    expect(screen.getByText('₹12.50 left to assign')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Save ₹100.00/i }));
    expect(screen.getAllByText('₹12.50 left to assign').length).toBeGreaterThanOrEqual(1);
    expect(testStore.getState().trip.expenses).toHaveLength(6);

    await user.type(screen.getByLabelText('Kabir (₹)'), '12.50');
    expect(screen.getByText('All amounts assigned')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Save ₹100.00/i }));
    expect(screen.getByRole('heading', { level: 1, name: 'Expenses' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Kayaking' })).toBeInTheDocument();
    expect(testStore.getState().trip.expenses).toHaveLength(7);
  });

  it('supports percentage split live feedback and valid submission', async () => {
    const user = userEvent.setup();
    const { testStore } = renderAppAtAddExpense();

    await user.type(screen.getByLabelText(/Description/), 'Airport shuttle');
    await user.type(screen.getByLabelText(/Amount \(₹\)/), '500');
    await user.selectOptions(screen.getByLabelText(/Paid by/), 'm3');
    await user.selectOptions(screen.getByLabelText(/Category/), 'Travel');
    await user.click(screen.getByRole('radio', { name: 'Percentages' }));

    await user.type(screen.getByLabelText('Aarav (%)'), '60');
    await user.type(screen.getByLabelText('Diya (%)'), '30');
    expect(screen.getByText('10% left to assign')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Kabir (%)'), '10');
    expect(screen.getByText('100% assigned')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Save ₹500.00/i }));
    expect(screen.getByRole('heading', { level: 1, name: 'Expenses' })).toBeInTheDocument();
    expect(testStore.getState().trip.expenses).toHaveLength(7);
  });

  it('navigates back to dashboard without saving when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const { testStore } = renderAppAtAddExpense();

    await user.type(screen.getByLabelText(/Description/), 'Unsaved draft');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Expenses' })).toBeInTheDocument();
    expect(testStore.getState().trip.expenses).toHaveLength(6);
    expect(
      within(screen.getByRole('table')).queryByRole('rowheader', { name: 'Unsaved draft' }),
    ).not.toBeInTheDocument();
  });
});
