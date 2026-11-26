import { describe, expect, it } from 'vitest';
import type { Member } from '../types/expense';
import {
  evaluateExactSplitStatus,
  evaluatePercentSplitStatus,
  getEqualSplitPreview,
  getLocalTodayIsoDate,
  validateExpenseDraft,
  type ExpenseFormDraft,
} from './validation';

const MEMBERS: Member[] = [
  { id: 'm1', name: 'Aarav' },
  { id: 'm2', name: 'Diya' },
  { id: 'm3', name: 'Kabir' },
];

const TODAY = '2026-03-20';

function createValidDraft(overrides: Partial<ExpenseFormDraft> = {}): ExpenseFormDraft {
  return {
    description: 'Boat ride',
    amount: '300.00',
    paidBy: 'm1',
    date: '2026-03-19',
    category: 'Activities',
    splitType: 'equal',
    equalMemberIds: ['m1', 'm2', 'm3'],
    exactShares: { m1: '100', m2: '100', m3: '100' },
    percentShares: { m1: '33.33', m2: '33.33', m3: '33.34' },
    ...overrides,
  };
}

describe('getLocalTodayIsoDate', () => {
  it('formats local year-month-day without UTC offset drift', () => {
    const localDate = new Date(2026, 2, 5, 0, 15, 0);
    expect(getLocalTodayIsoDate(localDate)).toBe('2026-03-05');
  });
});

describe('validateExpenseDraft', () => {
  it('accepts valid equal, exact, and percent expense drafts', () => {
    const equalResult = validateExpenseDraft(createValidDraft(), MEMBERS, TODAY);
    expect(equalResult).toEqual({
      ok: true,
      expenseInput: {
        description: 'Boat ride',
        amount: 30000,
        paidBy: 'm1',
        date: '2026-03-19',
        category: 'Activities',
        split: { type: 'equal', memberIds: ['m1', 'm2', 'm3'] },
      },
    });

    const exactResult = validateExpenseDraft(
      createValidDraft({
        amount: '150.50',
        paidBy: 'm1',
        splitType: 'exact',
        exactShares: { m1: '0', m2: '100.50', m3: '50' },
      }),
      MEMBERS,
      TODAY,
    );
    expect(exactResult).toEqual({
      ok: true,
      expenseInput: {
        description: 'Boat ride',
        amount: 15050,
        paidBy: 'm1',
        date: '2026-03-19',
        category: 'Activities',
        split: { type: 'exact', shares: { m1: 0, m2: 10050, m3: 5000 } },
      },
    });

    const percentResult = validateExpenseDraft(
      createValidDraft({ splitType: 'percent' }),
      MEMBERS,
      TODAY,
    );
    expect(percentResult.ok).toBe(true);
  });

  it('validates description, amount bounds, decimals, date, paidBy, and category', () => {
    const result = validateExpenseDraft(
      createValidDraft({
        description: '   ',
        amount: '-10',
        paidBy: '',
        date: '2026-03-21',
        category: '',
      }),
      MEMBERS,
      TODAY,
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.errors.description).toBe('Description is required.');
    expect(result.errors.amount).toBe('Amount must be more than ₹0');
    expect(result.errors.paidBy).toBe('Please select who paid.');
    expect(result.errors.date).toBe('Date cannot be in the future.');
    expect(result.errors.category).toBe('Please select a category.');
  });

  it('enforces max 60 description chars, ₹10,00,000 max amount, and max 2 decimals', () => {
    const longDesc = 'x'.repeat(61);
    const overMax = validateExpenseDraft(
      createValidDraft({
        description: longDesc,
        amount: '1000000.01',
      }),
      MEMBERS,
      TODAY,
    );
    expect(overMax.ok).toBe(false);
    if (!overMax.ok) {
      expect(overMax.errors.description).toBe('Description must be at most 60 characters.');
      expect(overMax.errors.amount).toBe('Amount must be at most ₹10,00,000.');
    }

    const tooManyDecimals = validateExpenseDraft(
      createValidDraft({ amount: '12.345' }),
      MEMBERS,
      TODAY,
    );
    expect(tooManyDecimals.ok).toBe(false);
    if (!tooManyDecimals.ok) {
      expect(tooManyDecimals.errors.amount).toBe('Amount can have at most 2 decimal places.');
    }
  });

  it('validates equal, exact, and percent split rules and produces helpful messages', () => {
    const missingEqualMember = validateExpenseDraft(
      createValidDraft({ splitType: 'equal', equalMemberIds: [] }),
      MEMBERS,
      TODAY,
    );
    expect(missingEqualMember.ok).toBe(false);
    if (!missingEqualMember.ok) {
      expect(missingEqualMember.errors.split).toBe('Select at least one member for the split.');
    }

    const exactUnder = validateExpenseDraft(
      createValidDraft({
        amount: '100.00',
        splitType: 'exact',
        exactShares: { m1: '50', m2: '37.50', m3: '' },
      }),
      MEMBERS,
      TODAY,
    );
    expect(exactUnder.ok).toBe(false);
    if (!exactUnder.ok) {
      expect(exactUnder.errors.split).toBe('₹12.50 left to assign');
    }

    const exactNegative = validateExpenseDraft(
      createValidDraft({
        amount: '100',
        splitType: 'exact',
        exactShares: { m1: '110', m2: '-10', m3: '0' },
      }),
      MEMBERS,
      TODAY,
    );
    expect(exactNegative.ok).toBe(false);
    if (!exactNegative.ok) {
      expect(exactNegative.errors.exactMemberErrors.m2).toBe('Amount must be ₹0 or more.');
    }

    const percentOver = validateExpenseDraft(
      createValidDraft({
        splitType: 'percent',
        percentShares: { m1: '50', m2: '60', m3: '0' },
      }),
      MEMBERS,
      TODAY,
    );
    expect(percentOver.ok).toBe(false);
    if (!percentOver.ok) {
      expect(percentOver.errors.split).toBe('10% over');
    }

    const percentBad = validateExpenseDraft(
      createValidDraft({
        splitType: 'percent',
        percentShares: { m1: '105', m2: '10.123', m3: '0' },
      }),
      MEMBERS,
      TODAY,
    );
    expect(percentBad.ok).toBe(false);
    if (!percentBad.ok) {
      expect(percentBad.errors.percentMemberErrors.m1).toBe(
        'Percentage must be between 0 and 100.',
      );
      expect(percentBad.errors.percentMemberErrors.m2).toBe('Max 2 decimal places.');
    }
  });
});

describe('live split helpers', () => {
  it('computes exact, percent, and equal preview helpers', () => {
    expect(
      evaluateExactSplitStatus(10000, { m1: '50', m2: '37.50', m3: '0' }, MEMBERS).message,
    ).toBe('₹12.50 left to assign');
    expect(
      evaluateExactSplitStatus(10000, { m1: '60', m2: '50', m3: '0' }, MEMBERS).message,
    ).toBe('₹10.00 over');
    expect(
      evaluatePercentSplitStatus({ m1: '40', m2: '40', m3: '' }, MEMBERS).message,
    ).toBe('20% left to assign');
    expect(
      evaluatePercentSplitStatus({ m1: '60', m2: '50', m3: '0' }, MEMBERS).message,
    ).toBe('10% over');
    expect(getEqualSplitPreview(10000, ['m1', 'm2', 'm3'], MEMBERS)).toEqual({
      m1: 3334,
      m2: 3333,
      m3: 3333,
    });
  });
});
