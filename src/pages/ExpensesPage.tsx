import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BalanceGrid } from '../components/expenses/BalanceGrid';
import { ExpenseFilters, type CategoryFilter } from '../components/expenses/ExpenseFilters';
import { ExpenseTable } from '../components/expenses/ExpenseTable';
import { SummaryCards } from '../components/expenses/SummaryCards';
import { AlertBanner } from '../components/ui/AlertBanner';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { formatPaise } from '../domain/money';
import {
  deleteExpense,
  selectDashboardSummary,
  selectMemberBalances,
  selectMembers,
  selectSortedExpenses,
} from '../store/expensesSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import styles from './ExpensesPage.module.css';

function extractFlashMessage(state: unknown): string | null {
  if (typeof state !== 'object' || state === null) {
    return null;
  }
  if ('flashMessage' in state && typeof state.flashMessage === 'string') {
    return state.flashMessage;
  }
  return null;
}

export function ExpensesPage() {
  const members = useAppSelector(selectMembers);
  const sortedExpenses = useAppSelector(selectSortedExpenses);
  const balances = useAppSelector(selectMemberBalances);
  const summary = useAppSelector(selectDashboardSummary);
  const dispatch = useAppDispatch();

  const location = useLocation();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(() =>
    extractFlashMessage(location.state),
  );

  useEffect(() => {
    document.title = 'Expenses | Trip Splitter';
  }, []);

  useEffect(() => {
    const incoming = extractFlashMessage(location.state);
    if (incoming) {
      void navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const filteredExpenses =
    selectedCategory === 'All'
      ? sortedExpenses
      : sortedExpenses.filter((expense) => expense.category === selectedCategory);

  const filteredTotalPaise = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const pendingExpense =
    pendingDeleteId !== null
      ? (sortedExpenses.find((expense) => expense.id === pendingDeleteId) ?? null)
      : null;

  function handleConfirmDelete(): void {
    if (!pendingExpense) {
      return;
    }
    dispatch(deleteExpense(pendingExpense.id));
    setPendingDeleteId(null);
    setBannerMessage(`Deleted "${pendingExpense.description}".`);
    const mainHeading = document.getElementById('main-content');
    mainHeading?.focus();
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.eyebrow}>Goa Getaway</span>
          <h1 className={styles.title}>Expenses</h1>
          <p className={styles.subtitle}>
            {members.length} trip members · {sortedExpenses.length}{' '}
            {sortedExpenses.length === 1 ? 'recorded expense' : 'recorded expenses'}
          </p>
        </div>

        <Link to="/expenses/new" className={styles.primaryAction}>
          Add expense
        </Link>
      </div>

      {bannerMessage ? (
        <AlertBanner
          message={bannerMessage}
          tone="success"
          onDismiss={() => {
            setBannerMessage(null);
          }}
        />
      ) : null}

      <SummaryCards summary={summary} />

      <BalanceGrid balances={balances} />

      <section aria-labelledby="expense-history-heading" className={styles.historySection}>
        <h2 id="expense-history-heading" className={styles.sectionHeading}>
          Expense history
        </h2>

        <Card padding="md">
          <ExpenseFilters
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            filteredCount={filteredExpenses.length}
            filteredTotalPaise={filteredTotalPaise}
          />

          {sortedExpenses.length === 0 ? (
            <EmptyState
              title="No expenses recorded yet"
              description="Add the first shared expense for Goa Getaway to start tracking balances."
              action={
                <Link to="/expenses/new" className={styles.primaryAction}>
                  Add expense
                </Link>
              }
            />
          ) : filteredExpenses.length === 0 ? (
            <EmptyState
              title={`No expenses in ${selectedCategory}`}
              description="Try switching to another category or view all trip expenses."
              action={
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setSelectedCategory('All');
                  }}
                >
                  Show all expenses
                </Button>
              }
            />
          ) : (
            <ExpenseTable
              expenses={filteredExpenses}
              members={members}
              onDeleteRequest={setPendingDeleteId}
            />
          )}
        </Card>
      </section>

      <ConfirmDialog
        isOpen={pendingExpense !== null}
        title="Delete expense?"
        description={
          pendingExpense
            ? `Are you sure you want to delete "${pendingExpense.description}" (${formatPaise(pendingExpense.amount)})? Balances will recalculate immediately.`
            : ''
        }
        confirmLabel="Delete expense"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}
