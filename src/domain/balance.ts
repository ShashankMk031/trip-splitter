import type { Expense, Member } from '../types/expense';
import { calculateExpenseShares } from './split';

export interface MemberBalance {
  memberId: string;
  name: string;
  paidPaise: number;
  sharePaise: number;
  /** Positive means member gets money back; negative means member owes money */
  netPaise: number;
}

export interface DashboardSummary {
  totalExpensesPaise: number;
  totalOwedToMembersPaise: number;
  totalOwedByMembersPaise: number;
  expenseCount: number;
}

/**
 * Computes each member's paid total, share total, and net balance in integer paise.
 * Net balance = total paid - total share. Total net across all members always equals 0.
 */
export function calculateMemberBalances(
  members: readonly Member[],
  expenses: readonly Expense[],
): MemberBalance[] {
  const paidByMember = new Map<string, number>();
  const shareByMember = new Map<string, number>();

  for (const member of members) {
    paidByMember.set(member.id, 0);
    shareByMember.set(member.id, 0);
  }

  for (const expense of expenses) {
    if (!paidByMember.has(expense.paidBy)) {
      throw new Error(`Expense "${expense.id}" references unknown payer "${expense.paidBy}".`);
    }

    paidByMember.set(expense.paidBy, (paidByMember.get(expense.paidBy) ?? 0) + expense.amount);

    const shares = calculateExpenseShares(expense, members);
    for (const [memberId, sharePaise] of Object.entries(shares)) {
      shareByMember.set(memberId, (shareByMember.get(memberId) ?? 0) + sharePaise);
    }
  }

  return members.map((member) => {
    const paidPaise = paidByMember.get(member.id) ?? 0;
    const sharePaise = shareByMember.get(member.id) ?? 0;
    return {
      memberId: member.id,
      name: member.name,
      paidPaise,
      sharePaise,
      netPaise: paidPaise - sharePaise,
    };
  });
}

/**
 * Computes aggregate metrics for the dashboard summary cards.
 */
export function calculateDashboardSummary(
  balances: readonly MemberBalance[],
  expenses: readonly Expense[],
): DashboardSummary {
  const totalExpensesPaise = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  let totalOwedToMembersPaise = 0;
  let totalOwedByMembersPaise = 0;

  for (const balance of balances) {
    if (balance.netPaise > 0) {
      totalOwedToMembersPaise += balance.netPaise;
    } else if (balance.netPaise < 0) {
      totalOwedByMembersPaise += Math.abs(balance.netPaise);
    }
  }

  return {
    totalExpensesPaise,
    totalOwedToMembersPaise,
    totalOwedByMembersPaise,
    expenseCount: expenses.length,
  };
}
