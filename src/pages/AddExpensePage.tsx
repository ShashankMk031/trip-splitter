import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Page.module.css';

export function AddExpensePage() {
  useEffect(() => {
    document.title = 'Add expense | Trip Splitter';
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Add expense</h1>
          <p className={styles.subtitle}>Record a shared expense for the trip.</p>
        </div>
      </div>

      <section className={styles.card} aria-label="Add expense form placeholder">
        <p className={styles.subtitle}>
          Expense creation form and split controls will be implemented in the next phase.
        </p>
        <Link to="/" className={styles.actionLink}>
          Back to Expenses
        </Link>
      </section>
    </div>
  );
}
