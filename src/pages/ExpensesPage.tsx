import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { selectExpenses, selectMembers } from '../store/expensesSlice';
import { useAppSelector } from '../store/hooks';
import styles from './Page.module.css';

export function ExpensesPage() {
  const members = useAppSelector(selectMembers);
  const expenses = useAppSelector(selectExpenses);

  useEffect(() => {
    document.title = 'Expenses | Trip Splitter';
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Expenses</h1>
          <p className={styles.subtitle}>
            {members.length} trip members · {expenses.length} recorded expenses
          </p>
        </div>
        <Link to="/expenses/new" className={styles.actionLink}>
          Add expense
        </Link>
      </div>

      <section className={styles.card} aria-label="Expenses dashboard placeholder">
        <p className={styles.subtitle}>
          Dashboard balances and expense ledger will be implemented in the next phase.
        </p>
      </section>
    </div>
  );
}
