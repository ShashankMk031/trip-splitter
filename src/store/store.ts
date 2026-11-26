import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { loadTripData, saveTripData, type StorageLike } from '../domain/storage';
import expensesReducer, {
  addExpense,
  deleteExpense,
  type ExpensesState,
} from './expensesSlice';

interface StoreStateShape {
  trip: ExpensesState;
}

export function createAppStore(
  preloadedState?: StoreStateShape,
  storage?: StorageLike | null,
) {
  const persistenceMiddleware = createListenerMiddleware<StoreStateShape>();

  persistenceMiddleware.startListening({
    matcher: isAnyOf(addExpense, deleteExpense),
    effect: (_action, listenerApi) => {
      const { members, expenses } = listenerApi.getState().trip;
      saveTripData({ members, expenses }, storage);
    },
  });

  const initialTripState: ExpensesState = preloadedState
    ? preloadedState.trip
    : loadTripData(storage);

  return configureStore({
    reducer: {
      trip: expensesReducer,
    },
    preloadedState: {
      trip: initialTripState,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(persistenceMiddleware.middleware),
  });
}

export const store = createAppStore();

export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
