import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExpenseForm } from '../components/form/ExpenseForm';
import { Card } from '../components/ui/Card';
import { formatPaise } from '../domain/money';
import { addExpense, selectMembers } from '../store/expensesSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import type { Expense } from '../types/expense';
import styles from './Page.module.css';

export function AddExpensePage() {
  const members = useAppSelector(selectMembers);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Add expense | Trip Splitter';
  }, []);

  function handleSave(expense: Expense): void {
    dispatch(addExpense(expense));
    void navigate('/', {
      state: {
        flashMessage: `Added "${expense.description}" (${formatPaise(expense.amount)}).`,
      },
    });
  }

  function handleCancel(): void {
    void navigate('/');
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Add expense</h1>
          <p className={styles.subtitle}>Record a shared expense for Goa Getaway.</p>
        </div>
      </div>

      <Card padding="lg">
        <ExpenseForm members={members} onSave={handleSave} onCancel={handleCancel} />
      </Card>
    </div>
  );
}
