import { useRef, useState, type SyntheticEvent } from 'react';
import { formatPaise, parseRupeesToPaise } from '../../domain/money';
import {
  EXPENSE_CATEGORIES,
  getLocalTodayIsoDate,
  MAX_DESCRIPTION_LENGTH,
  validateExpenseDraft,
  type ExpenseFormDraft,
  type ExpenseFormErrors,
  type SplitType,
} from '../../domain/validation';
import type { Expense, Member } from '../../types/expense';
import { Button } from '../ui/Button';
import { cx } from '../ui/cx';
import { FormField } from '../ui/FormField';
import { SplitEditor } from './SplitEditor';
import styles from './ExpenseForm.module.css';

interface ExpenseFormProps {
  members: readonly Member[];
  onSave: (expense: Expense) => void;
  onCancel: () => void;
}

function createInitialRecord(members: readonly Member[], initialValue: string): Record<string, string> {
  const record: Record<string, string> = {};
  for (const member of members) {
    record[member.id] = initialValue;
  }
  return record;
}

function generateExpenseId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `exp-${String(Date.now())}-${String(Math.floor(Math.random() * 100000))}`;
}

export function ExpenseForm({ members, onSave, onCancel }: ExpenseFormProps) {
  const [draft, setDraft] = useState<ExpenseFormDraft>(() => ({
    description: '',
    amount: '',
    paidBy: '',
    date: getLocalTodayIsoDate(),
    category: '',
    splitType: 'equal',
    equalMemberIds: members.map((member) => member.id),
    exactShares: createInitialRecord(members, ''),
    percentShares: createInitialRecord(members, ''),
  }));

  const [errors, setErrors] = useState<ExpenseFormErrors>({
    exactMemberErrors: {},
    percentMemberErrors: {},
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const descriptionRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const paidByRef = useRef<HTMLSelectElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);

  const parsedAmountResult = parseRupeesToPaise(draft.amount);
  const liveAmountPaise =
    parsedAmountResult.ok && parsedAmountResult.paise > 0 ? parsedAmountResult.paise : null;

  function focusFirstInvalidField(nextErrors: ExpenseFormErrors): void {
    if (nextErrors.description) {
      descriptionRef.current?.focus();
    } else if (nextErrors.amount) {
      amountRef.current?.focus();
    } else if (nextErrors.paidBy) {
      paidByRef.current?.focus();
    } else if (nextErrors.date) {
      dateRef.current?.focus();
    } else if (nextErrors.category) {
      categoryRef.current?.focus();
    }
  }

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (submittingRef.current) {
      return;
    }

    const validation = validateExpenseDraft(draft, members);
    if (!validation.ok) {
      setErrors(validation.errors);
      focusFirstInvalidField(validation.errors);
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    const newExpense: Expense = {
      id: generateExpenseId(),
      ...validation.expenseInput,
    };

    onSave(newExpense);
  }

  function handleToggleEqualMember(memberId: string): void {
    setDraft((prev) => {
      const exists = prev.equalMemberIds.includes(memberId);
      const nextIds = exists
        ? prev.equalMemberIds.filter((id) => id !== memberId)
        : [...prev.equalMemberIds, memberId];
      return { ...prev, equalMemberIds: nextIds };
    });
    setErrors((prev) => ({ ...prev, split: undefined }));
  }

  function handleSplitTypeChange(nextType: SplitType): void {
    setDraft((prev) => ({ ...prev, splitType: nextType }));
    setErrors((prev) => ({
      ...prev,
      split: undefined,
      exactMemberErrors: {},
      percentMemberErrors: {},
    }));
  }

  function handleExactShareChange(memberId: string, value: string): void {
    setDraft((prev) => ({
      ...prev,
      exactShares: { ...prev.exactShares, [memberId]: value },
    }));
    setErrors((prev) => ({
      ...prev,
      split: undefined,
      exactMemberErrors: Object.fromEntries(
        Object.entries(prev.exactMemberErrors).filter(([id]) => id !== memberId),
      ),
    }));
  }

  function handlePercentShareChange(memberId: string, value: string): void {
    setDraft((prev) => ({
      ...prev,
      percentShares: { ...prev.percentShares, [memberId]: value },
    }));
    setErrors((prev) => ({
      ...prev,
      split: undefined,
      percentMemberErrors: Object.fromEntries(
        Object.entries(prev.percentMemberErrors).filter(([id]) => id !== memberId),
      ),
    }));
  }

  return (
    <form noValidate onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.fieldGrid}>
        <div className={styles.fullSpan}>
          <FormField
            id="expense-description"
            label="Description"
            required
            hint={`Up to ${String(MAX_DESCRIPTION_LENGTH)} characters`}
            error={errors.description}
          >
            {(controlProps) => (
              <input
                ref={descriptionRef}
                type="text"
                name="description"
                maxLength={MAX_DESCRIPTION_LENGTH}
                placeholder="e.g. Ferry tickets to North Goa"
                value={draft.description}
                onChange={(event) => {
                  const value = event.target.value;
                  setDraft((prev) => ({ ...prev, description: value }));
                  if (errors.description) {
                    setErrors((prev) => ({ ...prev, description: undefined }));
                  }
                }}
                className={cx(styles.control, errors.description && styles.controlInvalid)}
                {...controlProps}
              />
            )}
          </FormField>
        </div>

        <FormField
          id="expense-amount"
          label="Amount (₹)"
          required
          hint="More than ₹0, up to ₹10,00,000 (max 2 decimals)"
          error={errors.amount}
        >
          {(controlProps) => (
            <input
              ref={amountRef}
              type="text"
              name="amount"
              inputMode="decimal"
              placeholder="0.00"
              value={draft.amount}
              onChange={(event) => {
                const value = event.target.value;
                setDraft((prev) => ({ ...prev, amount: value }));
                if (errors.amount) {
                  setErrors((prev) => ({ ...prev, amount: undefined }));
                }
              }}
              className={cx(
                styles.control,
                styles.numericControl,
                errors.amount && styles.controlInvalid,
              )}
              {...controlProps}
            />
          )}
        </FormField>

        <FormField
          id="expense-date"
          label="Date"
          required
          hint="Today or earlier"
          error={errors.date}
        >
          {(controlProps) => (
            <input
              ref={dateRef}
              type="date"
              name="date"
              max={getLocalTodayIsoDate()}
              value={draft.date}
              onChange={(event) => {
                const value = event.target.value;
                setDraft((prev) => ({ ...prev, date: value }));
                if (errors.date) {
                  setErrors((prev) => ({ ...prev, date: undefined }));
                }
              }}
              className={cx(styles.control, errors.date && styles.controlInvalid)}
              {...controlProps}
            />
          )}
        </FormField>

        <FormField id="expense-paid-by" label="Paid by" required error={errors.paidBy}>
          {(controlProps) => (
            <select
              ref={paidByRef}
              name="paidBy"
              value={draft.paidBy}
              onChange={(event) => {
                const value = event.target.value;
                setDraft((prev) => ({ ...prev, paidBy: value }));
                if (errors.paidBy) {
                  setErrors((prev) => ({ ...prev, paidBy: undefined }));
                }
              }}
              className={cx(styles.control, errors.paidBy && styles.controlInvalid)}
              {...controlProps}
            >
              <option value="">Select who paid</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <FormField id="expense-category" label="Category" required error={errors.category}>
          {(controlProps) => (
            <select
              ref={categoryRef}
              name="category"
              value={draft.category}
              onChange={(event) => {
                const value = event.target.value;
                setDraft((prev) => ({ ...prev, category: value }));
                if (errors.category) {
                  setErrors((prev) => ({ ...prev, category: undefined }));
                }
              }}
              className={cx(styles.control, errors.category && styles.controlInvalid)}
              {...controlProps}
            >
              <option value="">Select category</option>
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          )}
        </FormField>
      </div>

      <div className={styles.divider} />

      <SplitEditor
        members={members}
        splitType={draft.splitType}
        onSplitTypeChange={handleSplitTypeChange}
        amountPaise={liveAmountPaise}
        equalMemberIds={draft.equalMemberIds}
        onToggleEqualMember={handleToggleEqualMember}
        exactShares={draft.exactShares}
        onExactShareChange={handleExactShareChange}
        percentShares={draft.percentShares}
        onPercentShareChange={handlePercentShareChange}
        splitError={errors.split}
        exactMemberErrors={errors.exactMemberErrors}
        percentMemberErrors={errors.percentMemberErrors}
      />

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting
            ? 'Saving…'
            : liveAmountPaise !== null
              ? `Save ${formatPaise(liveAmountPaise)}`
              : 'Save expense'}
        </Button>
      </div>
    </form>
  );
}
