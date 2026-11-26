export type ExpenseCategory = 'Food' | 'Travel' | 'Stay' | 'Activities' | 'Other';

export interface Member {
  id: string;
  name: string;
}

export interface EqualSplit {
  type: 'equal';
  memberIds: string[];
}

export interface ExactSplit {
  type: 'exact';
  /** Amount owed per member in integer paise */
  shares: Record<string, number>;
}

export interface PercentSplit {
  type: 'percent';
  /** Percentage share per member (0 to 100, up to 2 decimals) */
  shares: Record<string, number>;
}

export type Split = EqualSplit | ExactSplit | PercentSplit;

export interface Expense {
  id: string;
  description: string;
  /** Total amount in integer paise */
  amount: number;
  paidBy: string;
  /** ISO calendar date YYYY-MM-DD */
  date: string;
  category: ExpenseCategory;
  split: Split;
}

export interface TripData {
  members: Member[];
  expenses: Expense[];
}
