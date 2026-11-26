import { describe, expect, it, vi } from 'vitest';
import { getSampleTripData } from './sampleData';
import {
  loadTripData,
  saveTripData,
  TRIP_STORAGE_KEY,
  type StorageLike,
} from './storage';
import type { TripData } from '../types/expense';

function createMemoryStorage(initialEntries: Record<string, string> = {}): StorageLike & {
  setItemSpy: ReturnType<typeof vi.fn>;
  getItemSpy: ReturnType<typeof vi.fn>;
} {
  const map = new Map<string, string>(Object.entries(initialEntries));
  const getItemSpy = vi.fn((key: string) => map.get(key) ?? null);
  const setItemSpy = vi.fn((key: string, value: string) => {
    map.set(key, value);
  });

  return {
    getItem: getItemSpy,
    setItem: setItemSpy,
    getItemSpy,
    setItemSpy,
  };
}

describe('storage domain helpers', () => {
  it('returns sample data on first launch when storage is empty without writing', () => {
    const storage = createMemoryStorage();
    const data = loadTripData(storage);

    expect(data).toEqual(getSampleTripData());
    expect(storage.setItemSpy).not.toHaveBeenCalled();
  });

  it('hydrates valid persisted trip data', () => {
    const customData: TripData = {
      members: [
        { id: 'm1', name: 'Aarav' },
        { id: 'm2', name: 'Diya' },
      ],
      expenses: [
        {
          id: 'custom-1',
          description: 'Coffee',
          amount: 25000,
          paidBy: 'm1',
          date: '2026-03-18',
          category: 'Food',
          split: { type: 'equal', memberIds: ['m1', 'm2'] },
        },
      ],
    };

    const storage = createMemoryStorage({
      [TRIP_STORAGE_KEY]: JSON.stringify(customData),
    });

    const loaded = loadTripData(storage);
    expect(loaded).toEqual(customData);
    expect(storage.setItemSpy).not.toHaveBeenCalled();
  });

  it('falls back to sample data when stored JSON is corrupted or violates schema/invariants', () => {
    const sample = getSampleTripData();

    const malformedStorage = createMemoryStorage({
      [TRIP_STORAGE_KEY]: '{not valid json',
    });
    expect(loadTripData(malformedStorage)).toEqual(sample);

    const wrongShapeStorage = createMemoryStorage({
      [TRIP_STORAGE_KEY]: JSON.stringify({ members: 'bad', expenses: [] }),
    });
    expect(loadTripData(wrongShapeStorage)).toEqual(sample);

    const semanticErrorStorage = createMemoryStorage({
      [TRIP_STORAGE_KEY]: JSON.stringify({
        members: [{ id: 'm1', name: 'Aarav' }],
        expenses: [
          {
            id: 'bad-1',
            description: 'Unknown payer',
            amount: 1000,
            paidBy: 'missing-member',
            date: '2026-03-18',
            category: 'Food',
            split: { type: 'equal', memberIds: ['m1'] },
          },
        ],
      }),
    });
    expect(loadTripData(semanticErrorStorage)).toEqual(sample);

    const mismatchedSplitStorage = createMemoryStorage({
      [TRIP_STORAGE_KEY]: JSON.stringify({
        members: [
          { id: 'm1', name: 'Aarav' },
          { id: 'm2', name: 'Diya' },
        ],
        expenses: [
          {
            id: 'bad-2',
            description: 'Bad exact sum',
            amount: 1000,
            paidBy: 'm1',
            date: '2026-03-18',
            category: 'Food',
            split: { type: 'exact', shares: { m1: 400, m2: 400 } },
          },
        ],
      }),
    });
    expect(loadTripData(mismatchedSplitStorage)).toEqual(sample);
  });

  it('handles storage access failures gracefully on both load and save', () => {
    const throwingStorage: StorageLike = {
      getItem() {
        throw new Error('SecurityError');
      },
      setItem() {
        throw new Error('QuotaExceededError');
      },
    };

    expect(loadTripData(throwingStorage)).toEqual(getSampleTripData());
    expect(saveTripData(getSampleTripData(), throwingStorage)).toBe(false);
    expect(loadTripData(null)).toEqual(getSampleTripData());
    expect(saveTripData(getSampleTripData(), null)).toBe(false);
  });
});
