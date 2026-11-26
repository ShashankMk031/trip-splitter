import { describe, expect, it, vi } from 'vitest';
import { getSampleTripData } from '../domain/sampleData';
import { TRIP_STORAGE_KEY, type StorageLike } from '../domain/storage';
import type { Expense, TripData } from '../types/expense';
import { addExpense, deleteExpense } from './expensesSlice';
import { createAppStore } from './store';

function createMockStorage(initialValue?: string) {
  const map = new Map<string, string>();
  if (initialValue !== undefined) {
    map.set(TRIP_STORAGE_KEY, initialValue);
  }

  const getItem = vi.fn((key: string) => map.get(key) ?? null);
  const setItem = vi.fn((key: string, value: string) => {
    map.set(key, value);
  });

  return {
    storage: { getItem, setItem },
    getItem,
    setItem,
    readSavedRaw: () => map.get(TRIP_STORAGE_KEY) ?? null,
  };
}

describe('Redux store hydration and localStorage persistence', () => {
  it('hydrates from sample data on first launch without writing on startup', () => {
    const mock = createMockStorage();
    const store = createAppStore(undefined, mock.storage);

    expect(store.getState().trip).toEqual(getSampleTripData());
    expect(mock.getItem).toHaveBeenCalledTimes(1);
    expect(mock.setItem).not.toHaveBeenCalled();
  });

  it('hydrates valid saved data and does not overwrite it on startup', () => {
    const savedData: TripData = {
      members: [
        { id: 'm1', name: 'Aarav' },
        { id: 'm2', name: 'Diya' },
      ],
      expenses: [
        {
          id: 'saved-e1',
          description: 'Sunset cruise',
          amount: 150000,
          paidBy: 'm2',
          date: '2026-03-19',
          category: 'Activities',
          split: { type: 'equal', memberIds: ['m1', 'm2'] },
        },
      ],
    };

    const raw = JSON.stringify(savedData);
    const mock = createMockStorage(raw);
    const store = createAppStore(undefined, mock.storage);

    expect(store.getState().trip).toEqual(savedData);
    expect(mock.setItem).not.toHaveBeenCalled();
    expect(mock.readSavedRaw()).toBe(raw);
  });

  it('falls back to sample data when stored JSON is invalid or corrupted', () => {
    const mock = createMockStorage('{"corrupted":true}');
    const store = createAppStore(undefined, mock.storage);

    expect(store.getState().trip).toEqual(getSampleTripData());
    expect(mock.setItem).not.toHaveBeenCalled();
  });

  it('persists added expenses and rehydrates them into a new store instance', () => {
    const mock = createMockStorage();
    const store = createAppStore(undefined, mock.storage);

    const added: Expense = {
      id: 'new-1',
      description: 'Water sports',
      amount: 180000,
      paidBy: 'm1',
      date: '2026-03-20',
      category: 'Activities',
      split: { type: 'equal', memberIds: ['m1', 'm2', 'm3'] },
    };

    store.dispatch(addExpense(added));

    expect(mock.setItem).toHaveBeenCalledTimes(1);
    expect(store.getState().trip.expenses).toHaveLength(7);

    const reloadedStore = createAppStore(undefined, mock.storage);
    expect(reloadedStore.getState().trip.expenses).toHaveLength(7);
    expect(reloadedStore.getState().trip.expenses.find((e) => e.id === 'new-1')).toEqual(added);
  });

  it('persists deleted expenses and rehydrates the updated list', () => {
    const mock = createMockStorage();
    const store = createAppStore(undefined, mock.storage);

    store.dispatch(deleteExpense('e6'));

    expect(mock.setItem).toHaveBeenCalledTimes(1);
    expect(store.getState().trip.expenses.some((e) => e.id === 'e6')).toBe(false);

    const reloadedStore = createAppStore(undefined, mock.storage);
    expect(reloadedStore.getState().trip.expenses).toHaveLength(5);
    expect(reloadedStore.getState().trip.expenses.some((e) => e.id === 'e6')).toBe(false);
  });

  it('continues operating in memory without crashing when storage throws', () => {
    const failingStorage: StorageLike = {
      getItem() {
        throw new Error('Access denied');
      },
      setItem() {
        throw new Error('Quota exceeded');
      },
    };

    const store = createAppStore(undefined, failingStorage);
    expect(store.getState().trip).toEqual(getSampleTripData());

    expect(() => {
      store.dispatch(deleteExpense('e1'));
    }).not.toThrow();

    expect(store.getState().trip.expenses).toHaveLength(5);
  });
});
