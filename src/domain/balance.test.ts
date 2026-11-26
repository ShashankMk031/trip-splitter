import { describe, expect, it } from 'vitest';
import type { Expense, Member } from '../types/expense';
import { calculateDashboardSummary, calculateMemberBalances } from './balance';
import { getSampleTripData } from './sampleData';

const MEMBERS: Member[] = [
  { id: 'm1', name: 'Aarav' },
  { id: 'm2', name: 'Diya' },
  { id: 'm3', name: 'Kabir' },
];

describe('calculateMemberBalances', () => {
  it('returns zero balances for all members when there are no expenses', () => {
    const balances = calculateMemberBalances(MEMBERS, []);

    expect(balances).toEqual([
      { memberId: 'm1', name: 'Aarav', paidPaise: 0, sharePaise: 0, netPaise: 0 },
      { memberId: 'm2', name: 'Diya', paidPaise: 0, sharePaise: 0, netPaise: 0 },
      { memberId: 'm3', name: 'Kabir', paidPaise: 0, sharePaise: 0, netPaise: 0 },
    ]);
  });

  it('handles payer excluded from the split', () => {
    const expenses: Expense[] = [
      {
        id: 'tx1',
        description: 'Groceries for others',
        amount: 10000,
        paidBy: 'm1',
        date: '2026-03-14',
        category: 'Food',
        split: { type: 'equal', memberIds: ['m2', 'm3'] },
      },
    ];

    const balances = calculateMemberBalances(MEMBERS, expenses);
    expect(balances).toEqual([
      { memberId: 'm1', name: 'Aarav', paidPaise: 10000, sharePaise: 0, netPaise: 10000 },
      { memberId: 'm2', name: 'Diya', paidPaise: 0, sharePaise: 5000, netPaise: -5000 },
      { memberId: 'm3', name: 'Kabir', paidPaise: 0, sharePaise: 5000, netPaise: -5000 },
    ]);
    expect(balances.reduce((sum, b) => sum + b.netPaise, 0)).toBe(0);
  });

  it('computes exact balances and summary for all sample expenses (e1-e6)', () => {
    const sample = getSampleTripData();
    const balances = calculateMemberBalances(sample.members, sample.expenses);

    expect(balances).toEqual([
      { memberId: 'm1', name: 'Aarav', paidPaise: 2549999, sharePaise: 694579, netPaise: 1855420 },
      { memberId: 'm2', name: 'Diya', paidPaise: 325000, sharePaise: 694578, netPaise: -369578 },
      { memberId: 'm3', name: 'Kabir', paidPaise: 1050000, sharePaise: 994592, netPaise: 55408 },
      { memberId: 'm4', name: 'Meera', paidPaise: 100000, sharePaise: 911250, netPaise: -811250 },
      { memberId: 'm5', name: 'Rohan', paidPaise: 200000, sharePaise: 930000, netPaise: -730000 },
    ]);

    const totalNet = balances.reduce((sum, b) => sum + b.netPaise, 0);
    expect(totalNet).toBe(0);

    const summary = calculateDashboardSummary(balances, sample.expenses);
    expect(summary).toEqual({
      totalExpensesPaise: 4224999,
      totalOwedToMembersPaise: 1910828,
      totalOwedByMembersPaise: 1910828,
      expenseCount: 6,
    });
  });

  it('maintains the zero-sum invariant across odd amounts, zero shares, and mixed split types', () => {
    const expenses: Expense[] = [
      {
        id: 't1',
        description: 'Odd equal split',
        amount: 10000,
        paidBy: 'm2',
        date: '2026-03-10',
        category: 'Food',
        split: { type: 'equal', memberIds: ['m1', 'm2', 'm3'] },
      },
      {
        id: 't2',
        description: 'Zero share exact',
        amount: 5003,
        paidBy: 'm3',
        date: '2026-03-11',
        category: 'Other',
        split: { type: 'exact', shares: { m1: 5003, m2: 0, m3: 0 } },
      },
      {
        id: 't3',
        description: 'Prime percent split',
        amount: 997,
        paidBy: 'm1',
        date: '2026-03-12',
        category: 'Travel',
        split: { type: 'percent', shares: { m1: 10, m2: 45, m3: 45 } },
      },
    ];

    const balances = calculateMemberBalances(MEMBERS, expenses);
    const totalNet = balances.reduce((sum, b) => sum + b.netPaise, 0);
    expect(totalNet).toBe(0);
  });
});
