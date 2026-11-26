import type { MemberBalance } from '../../domain/balance';
import { formatPaiseAbsolute } from '../../domain/money';
import { Badge, type BadgeTone } from '../ui/Badge';
import { Card } from '../ui/Card';
import styles from './BalanceGrid.module.css';

interface BalanceGridProps {
  balances: readonly MemberBalance[];
}

function getBalanceMeta(netPaise: number): {
  label: string;
  tone: BadgeTone;
} {
  if (netPaise > 0) {
    return {
      label: `gets back ${formatPaiseAbsolute(netPaise)}`,
      tone: 'positive',
    };
  }
  if (netPaise < 0) {
    return {
      label: `owes ${formatPaiseAbsolute(netPaise)}`,
      tone: 'negative',
    };
  }
  return {
    label: 'settled up',
    tone: 'neutral',
  };
}

export function BalanceGrid({ balances }: BalanceGridProps) {
  return (
    <section aria-labelledby="member-balances-heading" className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 id="member-balances-heading" className={styles.heading}>
          Member balances
        </h2>
        <p className={styles.hint}>Net position across all shared expenses</p>
      </div>

      <ul className={styles.grid} role="list">
        {balances.map((member) => {
          const { label, tone } = getBalanceMeta(member.netPaise);
          const initial = member.name.slice(0, 1).toUpperCase();

          return (
            <li key={member.memberId} className={styles.item}>
              <Card padding="sm" className={styles.memberCard}>
                <div className={styles.memberTop}>
                  <span className={styles.avatar} aria-hidden="true">
                    {initial}
                  </span>
                  <span className={styles.name}>{member.name}</span>
                </div>

                <div className={styles.statusRow}>
                  <Badge tone={tone} className={styles.balanceBadge}>
                    {label}
                  </Badge>
                </div>

                <p className={styles.breakdown}>
                  Paid {formatPaiseAbsolute(member.paidPaise)} · Share{' '}
                  {formatPaiseAbsolute(member.sharePaise)}
                </p>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
