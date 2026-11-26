import { formatPaise } from '../../domain/money';
import type { ExpenseCategory } from '../../types/expense';
import { cx } from '../ui/cx';
import styles from './ExpenseFilters.module.css';

export type CategoryFilter = 'All' | ExpenseCategory;

const FILTER_OPTIONS: readonly CategoryFilter[] = [
  'All',
  'Food',
  'Travel',
  'Stay',
  'Activities',
  'Other',
];

interface ExpenseFiltersProps {
  selectedCategory: CategoryFilter;
  onSelectCategory: (category: CategoryFilter) => void;
  filteredCount: number;
  filteredTotalPaise: number;
}

export function ExpenseFilters({
  selectedCategory,
  onSelectCategory,
  filteredCount,
  filteredTotalPaise,
}: ExpenseFiltersProps) {
  return (
    <div className={styles.bar}>
      <div
        role="group"
        aria-label="Filter expenses by category"
        className={styles.filterGroup}
      >
        {FILTER_OPTIONS.map((category) => {
          const isActive = category === selectedCategory;
          return (
            <button
              key={category}
              type="button"
              aria-pressed={isActive}
              onClick={() => {
                onSelectCategory(category);
              }}
              className={cx(styles.pill, isActive && styles.pillActive)}
            >
              {category}
            </button>
          );
        })}
      </div>

      <p className={styles.summary}>
        Showing <strong>{filteredCount}</strong>{' '}
        {filteredCount === 1 ? 'expense' : 'expenses'} · Total{' '}
        <strong className={styles.numeric}>{formatPaise(filteredTotalPaise)}</strong>
      </p>
    </div>
  );
}
