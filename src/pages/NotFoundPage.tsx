import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './Page.module.css';

export function NotFoundPage() {
  useEffect(() => {
    document.title = 'Page not found | Trip Splitter';
  }, []);

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>Page not found</h1>
        <p className={styles.subtitle}>
          The page you requested does not exist.
        </p>
        <Link to="/" className={styles.actionLink}>
          Back to Expenses
        </Link>
      </section>
    </div>
  );
}
