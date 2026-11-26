import type { DashboardSummary } from '../../domain/balance';
import { formatPaise } from '../../domain/money';
import { Card } from '../ui/Card';
import { cx } from '../ui/cx';
import styles from './SummaryCards.module.css';

interface SummaryCardsProps {
  summary: DashboardSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <section aria-label="Trip summary" className={styles.grid}>
      <Card padding="sm" className={styles.kpiCard}>
        <p className={styles.label}>Total trip expenses</p>
        <p className={cx(styles.value, styles.numeric)}>
          {formatPaise(summary.totalExpensesPaise)}
        </p>
      </Card>

      <Card padding="sm" className={styles.kpiCard}>
        <p className={styles.label}>Owed to members</p>
        <p className={cx(styles.value, styles.numeric, styles.positive)}>
          {formatPaise(summary.totalOwedToMembersPaise)}
        </p>
      </Card>

      <Card padding="sm" className={styles.kpiCard}>
        <p className={styles.label}>Owed by members</p>
        <p className={cx(styles.value, styles.numeric, styles.negative)}>
          {formatPaise(summary.totalOwedByMembersPaise)}
        </p>
      </Card>

      <Card padding="sm" className={styles.kpiCard}>
        <p className={styles.label}>Number of expenses</p>
        <p className={cx(styles.value, styles.numeric)}>{summary.expenseCount}</p>
      </Card>
    </section>
  );
}
