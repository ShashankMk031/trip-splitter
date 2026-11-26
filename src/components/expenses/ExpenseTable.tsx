import { useId } from 'react';
import { formatPaise } from '../../domain/money';
import { formatSplitSummary } from '../../domain/split';
import type { Expense, Member } from '../../types/expense';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cx } from '../ui/cx';
import styles from './ExpenseTable.module.css';

interface ExpenseTableProps {
  expenses: readonly Expense[];
  members: readonly Member[];
  onDeleteRequest?: (expenseId: string) => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatIsoDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) {
    return isoDate;
  }
  const year = parts[0] ?? '';
  const monthNumber = Number(parts[1]);
  const dayNumber = Number(parts[2]);
  const monthLabel = MONTHS[monthNumber - 1];
  if (!monthLabel || !Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 31) {
    return isoDate;
  }
  return `${String(dayNumber).padStart(2, '0')} ${monthLabel} ${year}`;
}

export function ExpenseTable({ expenses, members, onDeleteRequest }: ExpenseTableProps) {
  const captionId = useId();
  const memberNameById = new Map(members.map((member) => [member.id, member.name]));

  return (
    <div
      tabIndex={0}
      role="region"
      aria-labelledby={captionId}
      className={styles.tableWrapper}
    >
      <table className={styles.table}>
        <caption id={captionId} className="visually-hidden">
          Trip expenses sorted newest date first
        </caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Description</th>
            <th scope="col">Category</th>
            <th scope="col">Paid by</th>
            <th scope="col" className={styles.numericHeader}>
              Amount
            </th>
            <th scope="col">Split</th>
            <th scope="col" className={styles.actionsHeader}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => {
            const payerName = memberNameById.get(expense.paidBy) ?? 'Unknown';
            const splitLabel = formatSplitSummary(expense.split);

            return (
              <tr key={expense.id}>
                <td className={styles.dateCell}>{formatIsoDate(expense.date)}</td>
                <th scope="row" className={styles.descriptionCell}>
                  {expense.description}
                </th>
                <td className={styles.categoryCell}>
                  <Badge tone="accent">{expense.category}</Badge>
                </td>
                <td className={styles.paidByCell}>{payerName}</td>
                <td className={cx(styles.amountCell, styles.numeric)}>
                  {formatPaise(expense.amount)}
                </td>
                <td className={styles.splitCell}>{splitLabel}</td>
                <td className={styles.actionsCell}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Delete ${expense.description}`}
                    disabled={!onDeleteRequest}
                    title={
                      onDeleteRequest
                        ? `Delete ${expense.description}`
                        : 'Delete action will be enabled in a later phase'
                    }
                    onClick={() => {
                      if (onDeleteRequest) {
                        onDeleteRequest(expense.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
