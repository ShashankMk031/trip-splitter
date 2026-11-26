import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { getSampleTripData } from '../domain/sampleData';
import type { Expense, Member } from '../types/expense';

export interface ExpensesState {
  members: Member[];
  expenses: Expense[];
}

function getInitialState(): ExpensesState {
  const seed = getSampleTripData();
  return {
    members: seed.members,
    expenses: seed.expenses,
  };
}

export const expensesSlice = createSlice({
  name: 'trip',
  initialState: getInitialState,
  reducers: {
    addExpense(state, action: PayloadAction<Expense>) {
      state.expenses.push(action.payload);
    },
    deleteExpense(state, action: PayloadAction<string>) {
      state.expenses = state.expenses.filter((expense) => expense.id !== action.payload);
    },
  },
  selectors: {
    selectMembers: (state) => state.members,
    selectExpenses: (state) => state.expenses,
  },
});

export const { addExpense, deleteExpense } = expensesSlice.actions;
export const { selectMembers, selectExpenses } = expensesSlice.selectors;
export default expensesSlice.reducer;
