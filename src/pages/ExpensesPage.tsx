import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BalanceGrid } from '../components/expenses/BalanceGrid';
import { ExpenseFilters, type CategoryFilter } from '../components/expenses/ExpenseFilters';
import { ExpenseTable } from '../components/expenses/ExpenseTable';
import { SummaryCards } from '../components/expenses/SummaryCards';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import {
  selectDashboardSummary,
  selectMemberBalances,
  selectMembers,
  selectSortedExpenses,
} from '../store/expensesSlice';
import { useAppSelector } from '../store/hooks';
import styles from './ExpensesPage.module.css';

export function ExpensesPage() {
  const members = useAppSelector(selectMembers);
  const sortedExpenses = useAppSelector(selectSortedExpenses);
  const balances = useAppSelector(selectMemberBalances);
  const summary = useAppSelector(selectDashboardSummary);

  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');

  useEffect(() => {
    document.title = 'Expenses | Trip Splitter';
  }, []);

  const filteredExpenses =
    selectedCategory === 'All'
      ? sortedExpenses
      : sortedExpenses.filter((expense) => expense.category === selectedCategory);

  const filteredTotalPaise = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

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
            <ExpenseTable expenses={filteredExpenses} members={members} />
          )}
        </Card>
      </section>
    </div>
  );
}
