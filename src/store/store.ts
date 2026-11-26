import { configureStore } from '@reduxjs/toolkit';
import expensesReducer, { type ExpensesState } from './expensesSlice';

export function createAppStore(preloadedState?: { trip: ExpensesState }) {
  return configureStore({
    reducer: {
      trip: expensesReducer,
    },
    preloadedState,
  });
}

export const store = createAppStore();

export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
