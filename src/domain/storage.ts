import type { TripData } from '../types/expense';
import { getSampleTripData, isTripData } from './sampleData';
import { calculateExpenseShares } from './split';

export const TRIP_STORAGE_KEY = 'trip-splitter:v1:data';

export interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

function getBrowserLocalStorage(): StorageLike | null {
  try {
    if (typeof window === 'undefined' || !('localStorage' in window)) {
      return null;
    }
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Verifies domain invariants on structurally valid TripData so corrupted or
 * tampered storage payloads cannot crash balance/split calculations.
 */
function hasValidTripSemantics(data: TripData): boolean {
  if (data.members.length === 0) {
    return false;
  }

  const memberIds = new Set<string>();
  for (const member of data.members) {
    if (member.id.trim() === '' || member.name.trim() === '' || memberIds.has(member.id)) {
      return false;
    }
    memberIds.add(member.id);
  }

  for (const expense of data.expenses) {
    if (
      expense.id.trim() === '' ||
      expense.description.trim() === '' ||
      expense.amount <= 0 ||
      !memberIds.has(expense.paidBy) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(expense.date)
    ) {
      return false;
    }

    try {
      calculateExpenseShares(expense, data.members);
    } catch {
      return false;
    }
  }

  return true;
}

/**
 * Hydrates trip members and expenses from localStorage once on startup.
 * Falls back safely to sample data if storage is empty, inaccessible, or invalid.
 */
export function loadTripData(storage: StorageLike | null | undefined = getBrowserLocalStorage()): TripData {
  if (!storage) {
    return getSampleTripData();
  }

  let raw: string | null;
  try {
    raw = storage.getItem(TRIP_STORAGE_KEY);
  } catch {
    return getSampleTripData();
  }

  if (raw === null || raw.trim() === '') {
    return getSampleTripData();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return getSampleTripData();
  }

  if (!isTripData(parsed) || !hasValidTripSemantics(parsed)) {
    return getSampleTripData();
  }

  return parsed;
}

/**
 * Persists trip members and expenses to localStorage without throwing on quota
 * or privacy-mode storage errors.
 */
export function saveTripData(
  data: TripData,
  storage: StorageLike | null | undefined = getBrowserLocalStorage(),
): boolean {
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(TRIP_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
