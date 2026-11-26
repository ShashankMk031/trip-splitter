import type { Expense, ExpenseCategory, Member, Split } from '../types/expense';
import { formatPaise, parsePercentToBasisPoints, parseRupeesToPaise } from './money';
import { calculateExpenseShares } from './split';

export const MAX_DESCRIPTION_LENGTH = 60;
export const MAX_AMOUNT_PAISE = 100_000_000; // ₹10,00,000.00
const TOTAL_BASIS_POINTS = 10000;

export const EXPENSE_CATEGORIES: readonly ExpenseCategory[] = [
  'Food',
  'Travel',
  'Stay',
  'Activities',
  'Other',
];

export type SplitType = Split['type'];

export interface ExpenseFormDraft {
  description: string;
  amount: string;
  paidBy: string;
  date: string;
  category: string;
  splitType: SplitType;
  equalMemberIds: string[];
  exactShares: Record<string, string>;
  percentShares: Record<string, string>;
}

export interface ExpenseFormErrors {
  description?: string;
  amount?: string;
  paidBy?: string;
  date?: string;
  category?: string;
  split?: string;
  exactMemberErrors: Record<string, string>;
  percentMemberErrors: Record<string, string>;
}

export type ExpenseValidationResult =
  | {
      ok: true;
      expenseInput: Omit<Expense, 'id'>;
    }
  | {
      ok: false;
      errors: ExpenseFormErrors;
    };

export interface ExactSplitStatus {
  validEntries: boolean;
  assignedPaise: number;
  remainingPaise: number;
  message: string;
}

export interface PercentSplitStatus {
  validEntries: boolean;
  assignedBasisPoints: number;
  remainingBasisPoints: number;
  message: string;
}

/**
 * Returns today's local calendar date in YYYY-MM-DD format.
 */
export function getLocalTodayIsoDate(referenceDate: Date = new Date()): string {
  const year = String(referenceDate.getFullYear());
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
  const day = String(referenceDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidIsoCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parts = value.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }

  const candidate = new Date(year, month - 1, day);
  return (
    candidate.getFullYear() === year &&
    candidate.getMonth() === month - 1 &&
    candidate.getDate() === day
  );
}

function isExpenseCategoryValue(value: string): value is ExpenseCategory {
  return EXPENSE_CATEGORIES.some((category) => category === value);
}

/**
 * Formats integer basis points (100 = 1%) cleanly without trailing ".00" noise.
 */
export function formatBasisPointsAsPercent(basisPoints: number): string {
  const abs = Math.abs(basisPoints);
  const whole = Math.floor(abs / 100);
  const fraction = abs % 100;
  const sign = basisPoints < 0 ? '-' : '';

  if (fraction === 0) {
    return `${sign}${String(whole)}%`;
  }
  const trimmedFraction = String(fraction).padStart(2, '0').replace(/0+$/, '');
  return `${sign}${String(whole)}.${trimmedFraction}%`;
}

/**
 * Computes live assignment status for Exact split inputs.
 */
export function evaluateExactSplitStatus(
  amountPaise: number | null,
  exactShares: Readonly<Record<string, string>>,
  members: readonly Member[],
): ExactSplitStatus {
  let validEntries = true;
  let assignedPaise = 0;

  for (const member of members) {
    const raw = (exactShares[member.id] ?? '').trim();
    if (raw === '') {
      continue;
    }
    const parsed = parseRupeesToPaise(raw);
    if (!parsed.ok || parsed.paise < 0) {
      validEntries = false;
    } else {
      assignedPaise += parsed.paise;
    }
  }

  if (amountPaise === null || amountPaise <= 0) {
    return {
      validEntries,
      assignedPaise,
      remainingPaise: 0,
      message: 'Enter a valid expense amount to verify shares.',
    };
  }

  const remainingPaise = amountPaise - assignedPaise;
  if (!validEntries) {
    return {
      validEntries: false,
      assignedPaise,
      remainingPaise,
      message: 'Fix invalid member amounts.',
    };
  }

  if (remainingPaise > 0) {
    return {
      validEntries: true,
      assignedPaise,
      remainingPaise,
      message: `${formatPaise(remainingPaise)} left to assign`,
    };
  }

  if (remainingPaise < 0) {
    return {
      validEntries: true,
      assignedPaise,
      remainingPaise,
      message: `${formatPaise(Math.abs(remainingPaise))} over`,
    };
  }

  return {
    validEntries: true,
    assignedPaise,
    remainingPaise: 0,
    message: 'All amounts assigned',
  };
}

/**
 * Computes live assignment status for Percentage split inputs.
 */
export function evaluatePercentSplitStatus(
  percentShares: Readonly<Record<string, string>>,
  members: readonly Member[],
): PercentSplitStatus {
  let validEntries = true;
  let assignedBasisPoints = 0;

  for (const member of members) {
    const raw = (percentShares[member.id] ?? '').trim();
    if (raw === '') {
      continue;
    }
    const parsed = parsePercentToBasisPoints(raw);
    if (!parsed.ok || parsed.basisPoints < 0 || parsed.basisPoints > TOTAL_BASIS_POINTS) {
      validEntries = false;
    } else {
      assignedBasisPoints += parsed.basisPoints;
    }
  }

  const remainingBasisPoints = TOTAL_BASIS_POINTS - assignedBasisPoints;
  if (!validEntries) {
    return {
      validEntries: false,
      assignedBasisPoints,
      remainingBasisPoints,
      message: 'Fix invalid member percentages.',
    };
  }

  if (remainingBasisPoints > 0) {
    return {
      validEntries: true,
      assignedBasisPoints,
      remainingBasisPoints,
      message: `${formatBasisPointsAsPercent(remainingBasisPoints)} left to assign`,
    };
  }

  if (remainingBasisPoints < 0) {
    return {
      validEntries: true,
      assignedBasisPoints,
      remainingBasisPoints,
      message: `${formatBasisPointsAsPercent(Math.abs(remainingBasisPoints))} over`,
    };
  }

  return {
    validEntries: true,
    assignedBasisPoints,
    remainingBasisPoints: 0,
    message: '100% assigned',
  };
}

/**
 * Computes preview equal shares per participant when the amount is valid.
 */
export function getEqualSplitPreview(
  amountPaise: number | null,
  equalMemberIds: readonly string[],
  members: readonly Member[],
): Record<string, number> | null {
  if (amountPaise === null || amountPaise <= 0 || equalMemberIds.length === 0) {
    return null;
  }
  return calculateExpenseShares(
    {
      amount: amountPaise,
      split: { type: 'equal', memberIds: [...equalMemberIds] },
    },
    members,
  );
}

/**
 * Validates the entire Add Expense form draft and returns either field-level errors
 * or a clean, integer-paise expense payload ready for Redux dispatch.
 */
export function validateExpenseDraft(
  draft: ExpenseFormDraft,
  members: readonly Member[],
  todayIsoDate: string = getLocalTodayIsoDate(),
): ExpenseValidationResult {
  const errors: ExpenseFormErrors = {
    exactMemberErrors: {},
    percentMemberErrors: {},
  };

  const memberIds = new Set(members.map((member) => member.id));

  // 1. Description
  const trimmedDescription = draft.description.trim();
  if (trimmedDescription === '') {
    errors.description = 'Description is required.';
  } else if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `Description must be at most ${String(MAX_DESCRIPTION_LENGTH)} characters.`;
  }

  // 2. Amount
  const parsedAmount = parseRupeesToPaise(draft.amount);
  let validAmountPaise: number | null = null;
  if (!parsedAmount.ok) {
    switch (parsedAmount.error) {
      case 'empty':
        errors.amount = 'Amount is required.';
        break;
      case 'too_many_decimals':
        errors.amount = 'Amount can have at most 2 decimal places.';
        break;
      case 'out_of_range':
        errors.amount = 'Amount must be at most ₹10,00,000.';
        break;
      case 'invalid_format':
        errors.amount = 'Enter a valid amount.';
        break;
    }
  } else if (parsedAmount.paise <= 0) {
    errors.amount = 'Amount must be more than ₹0';
  } else if (parsedAmount.paise > MAX_AMOUNT_PAISE) {
    errors.amount = 'Amount must be at most ₹10,00,000.';
  } else {
    validAmountPaise = parsedAmount.paise;
  }

  // 3. Paid by
  if (!draft.paidBy || !memberIds.has(draft.paidBy)) {
    errors.paidBy = 'Please select who paid.';
  }

  // 4. Date
  const trimmedDate = draft.date.trim();
  if (trimmedDate === '') {
    errors.date = 'Date is required.';
  } else if (!isValidIsoCalendarDate(trimmedDate)) {
    errors.date = 'Enter a valid date.';
  } else if (trimmedDate > todayIsoDate) {
    errors.date = 'Date cannot be in the future.';
  }

  // 5. Category
  const validCategory = isExpenseCategoryValue(draft.category) ? draft.category : null;
  if (!validCategory) {
    errors.category = 'Please select a category.';
  }

  // 6. Split validation
  let validSplit: Split | null = null;

  if (draft.splitType === 'equal') {
    const selectedUnique = members
      .map((member) => member.id)
      .filter((id) => draft.equalMemberIds.includes(id));

    if (selectedUnique.length === 0) {
      errors.split = 'Select at least one member for the split.';
    } else {
      validSplit = { type: 'equal', memberIds: selectedUnique };
    }
  } else if (draft.splitType === 'exact') {
    const parsedShares: Record<string, number> = {};
    let totalExactPaise = 0;
    let allMemberInputsValid = true;

    for (const member of members) {
      const raw = (draft.exactShares[member.id] ?? '').trim();
      if (raw === '') {
        parsedShares[member.id] = 0;
        continue;
      }

      const parsed = parseRupeesToPaise(raw);
      if (!parsed.ok) {
        allMemberInputsValid = false;
        errors.exactMemberErrors[member.id] =
          parsed.error === 'too_many_decimals'
            ? 'Max 2 decimal places.'
            : 'Enter a valid amount.';
      } else if (parsed.paise < 0) {
        allMemberInputsValid = false;
        errors.exactMemberErrors[member.id] = 'Amount must be ₹0 or more.';
      } else {
        parsedShares[member.id] = parsed.paise;
        totalExactPaise += parsed.paise;
      }
    }

    if (allMemberInputsValid && validAmountPaise !== null) {
      if (totalExactPaise < validAmountPaise) {
        errors.split = `${formatPaise(validAmountPaise - totalExactPaise)} left to assign`;
      } else if (totalExactPaise > validAmountPaise) {
        errors.split = `${formatPaise(totalExactPaise - validAmountPaise)} over`;
      } else {
        validSplit = { type: 'exact', shares: parsedShares };
      }
    } else if (!allMemberInputsValid) {
      errors.split = 'Fix invalid exact amounts before saving.';
    } else {
      errors.split = 'Enter a valid expense amount to match exact shares.';
    }
  } else {
    const parsedPercentages: Record<string, number> = {};
    let totalBasisPoints = 0;
    let allPercentInputsValid = true;

    for (const member of members) {
      const raw = (draft.percentShares[member.id] ?? '').trim();
      if (raw === '') {
        parsedPercentages[member.id] = 0;
        continue;
      }

      const parsed = parsePercentToBasisPoints(raw);
      if (!parsed.ok) {
        allPercentInputsValid = false;
        errors.percentMemberErrors[member.id] =
          parsed.error === 'too_many_decimals'
            ? 'Max 2 decimal places.'
            : 'Enter a valid percentage.';
      } else if (parsed.basisPoints < 0 || parsed.basisPoints > TOTAL_BASIS_POINTS) {
        allPercentInputsValid = false;
        errors.percentMemberErrors[member.id] = 'Percentage must be between 0 and 100.';
      } else {
        parsedPercentages[member.id] = parsed.basisPoints / 100;
        totalBasisPoints += parsed.basisPoints;
      }
    }

    if (allPercentInputsValid) {
      if (totalBasisPoints < TOTAL_BASIS_POINTS) {
        errors.split = `${formatBasisPointsAsPercent(TOTAL_BASIS_POINTS - totalBasisPoints)} left to assign`;
      } else if (totalBasisPoints > TOTAL_BASIS_POINTS) {
        errors.split = `${formatBasisPointsAsPercent(totalBasisPoints - TOTAL_BASIS_POINTS)} over`;
      } else {
        validSplit = { type: 'percent', shares: parsedPercentages };
      }
    } else {
      errors.split = 'Fix invalid percentages before saving.';
    }
  }

  const hasErrors = Boolean(
    errors.description ||
      errors.amount ||
      errors.paidBy ||
      errors.date ||
      errors.category ||
      errors.split ||
      Object.keys(errors.exactMemberErrors).length > 0 ||
      Object.keys(errors.percentMemberErrors).length > 0,
  );

  if (hasErrors || validAmountPaise === null || !validCategory || !validSplit) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    expenseInput: {
      description: trimmedDescription,
      amount: validAmountPaise,
      paidBy: draft.paidBy,
      date: trimmedDate,
      category: validCategory,
      split: validSplit,
    },
  };
}
