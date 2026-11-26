import { describe, expect, it } from 'vitest';
import type { Member } from '../types/expense';
import { calculateExpenseShares, formatSplitSummary } from './split';

const MEMBERS: Member[] = [
  { id: 'm1', name: 'Aarav' },
  { id: 'm2', name: 'Diya' },
  { id: 'm3', name: 'Kabir' },
  { id: 'm4', name: 'Meera' },
  { id: 'm5', name: 'Rohan' },
];

describe('calculateExpenseShares — equal split', () => {
  it('splits ₹100 (10000 paise) equally between 3 members without losing a paisa', () => {
    const shares = calculateExpenseShares(
      {
        amount: 10000,
        split: { type: 'equal', memberIds: ['m1', 'm2', 'm3'] },
      },
      MEMBERS,
    );

    expect(shares).toEqual({
      m1: 3334,
      m2: 3333,
      m3: 3333,
    });
    expect(Object.values(shares).reduce((a, b) => a + b, 0)).toBe(10000);
  });

  it('allocates extra paise in trip member array order regardless of selection order', () => {
    const shares = calculateExpenseShares(
      {
        amount: 10002,
        split: { type: 'equal', memberIds: ['m5', 'm2', 'm4', 'm2'] },
      },
      MEMBERS,
    );

    // 10002 / 3 = 3334 each; test 10001 / 3 = 3333 rem 2 -> m2 and m4 get +1
    expect(shares).toEqual({ m2: 3334, m4: 3334, m5: 3334 });

    const unevenShares = calculateExpenseShares(
      {
        amount: 10001,
        split: { type: 'equal', memberIds: ['m5', 'm2', 'm4'] },
      },
      MEMBERS,
    );
    expect(unevenShares).toEqual({ m2: 3334, m4: 3334, m5: 3333 });
  });

  it('throws when no members are selected or an unknown member is referenced', () => {
    expect(() =>
      calculateExpenseShares({ amount: 1000, split: { type: 'equal', memberIds: [] } }, MEMBERS),
    ).toThrow();

    expect(() =>
      calculateExpenseShares(
        { amount: 1000, split: { type: 'equal', memberIds: ['unknown'] } },
        MEMBERS,
      ),
    ).toThrow();
  });
});

describe('calculateExpenseShares — exact split', () => {
  it('returns exact shares including zero-value shares when total matches amount', () => {
    const shares = calculateExpenseShares(
      {
        amount: 1050000,
        split: {
          type: 'exact',
          shares: { m1: 0, m3: 350000, m4: 350000, m5: 350000 },
        },
      },
      MEMBERS,
    );

    expect(shares).toEqual({ m1: 0, m3: 350000, m4: 350000, m5: 350000 });
    expect(Object.values(shares).reduce((a, b) => a + b, 0)).toBe(1050000);
  });

  it('throws when exact shares do not sum to expense amount or contain negatives', () => {
    expect(() =>
      calculateExpenseShares(
        { amount: 10000, split: { type: 'exact', shares: { m1: 5000, m2: 4999 } } },
        MEMBERS,
      ),
    ).toThrow();

    expect(() =>
      calculateExpenseShares(
        { amount: 10000, split: { type: 'exact', shares: { m1: 10500, m2: -500 } } },
        MEMBERS,
      ),
    ).toThrow();
  });
});

describe('calculateExpenseShares — percentage split (Largest Remainder Method)', () => {
  it('allocates sample expense e6 (149999 paise, 33.33% / 33.33% / 33.34%) cleanly', () => {
    const shares = calculateExpenseShares(
      {
        amount: 149999,
        split: {
          type: 'percent',
          shares: { m1: 33.33, m2: 33.33, m3: 33.34 },
        },
      },
      MEMBERS,
    );

    // 149999 * 3333 / 10000 = 49994.6667 (rem 6667)
    // 149999 * 3334 / 10000 = 50009.6666 (rem 6666)
    // Remainder of 2 paise goes to m1 and m2
    expect(shares).toEqual({
      m1: 49995,
      m2: 49995,
      m3: 50009,
    });
    expect(Object.values(shares).reduce((a, b) => a + b, 0)).toBe(149999);
  });

  it('breaks percentage remainder ties using trip member array order', () => {
    const shares = calculateExpenseShares(
      {
        amount: 101,
        split: {
          type: 'percent',
          shares: { m4: 50, m2: 50 },
        },
      },
      MEMBERS,
    );

    // Both have 0.5 remainder; m2 appears before m4 in MEMBERS
    expect(shares).toEqual({ m2: 51, m4: 50 });
  });

  it('supports zero-value percentage shares', () => {
    const shares = calculateExpenseShares(
      {
        amount: 20000,
        split: {
          type: 'percent',
          shares: { m1: 100, m2: 0 },
        },
      },
      MEMBERS,
    );

    expect(shares).toEqual({ m1: 20000, m2: 0 });
  });

  it('throws when percentages do not sum to 100% or exceed 2 decimal places', () => {
    expect(() =>
      calculateExpenseShares(
        {
          amount: 10000,
          split: { type: 'percent', shares: { m1: 50, m2: 49.99 } },
        },
        MEMBERS,
      ),
    ).toThrow();

    expect(() =>
      calculateExpenseShares(
        {
          amount: 10000,
          split: { type: 'percent', shares: { m1: 33.333, m2: 66.667 } },
        },
        MEMBERS,
      ),
    ).toThrow();
  });
});

describe('formatSplitSummary', () => {
  it('formats equal, exact, and percent summaries', () => {
    expect(formatSplitSummary({ type: 'equal', memberIds: ['m1', 'm2', 'm3', 'm4'] })).toBe(
      'Equally, 4 people',
    );
    expect(formatSplitSummary({ type: 'equal', memberIds: ['m1'] })).toBe('Equally, 1 person');
    expect(
      formatSplitSummary({ type: 'exact', shares: { m1: 0, m3: 5000, m4: 5000 } }),
    ).toBe('Exact, 2 people');
    expect(
      formatSplitSummary({ type: 'percent', shares: { m1: 33.33, m2: 33.33, m3: 33.34 } }),
    ).toBe('Percent, 3 people');
  });
});
