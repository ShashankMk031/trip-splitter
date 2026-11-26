import sampleDataJson from '../data/sample-data.json';
import type { Expense, ExpenseCategory, Member, Split, TripData } from '../types/expense';

const VALID_CATEGORIES = new Set<string>(['Food', 'Travel', 'Stay', 'Activities', 'Other']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isExpenseCategory(value: unknown): value is ExpenseCategory {
  return typeof value === 'string' && VALID_CATEGORIES.has(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isNumberRecord(value: unknown): value is Record<string, number> {
  if (!isRecord(value)) {
    return false;
  }
  return Object.values(value).every((val) => typeof val === 'number' && Number.isFinite(val));
}

function isSplit(value: unknown): value is Split {
  if (!isRecord(value)) {
    return false;
  }
  if (value.type === 'equal') {
    return isStringArray(value.memberIds);
  }
  if (value.type === 'exact' || value.type === 'percent') {
    return isNumberRecord(value.shares);
  }
  return false;
}

function isMember(value: unknown): value is Member {
  return isRecord(value) && typeof value.id === 'string' && typeof value.name === 'string';
}

function isExpense(value: unknown): value is Expense {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.description === 'string' &&
    typeof value.amount === 'number' &&
    Number.isInteger(value.amount) &&
    typeof value.paidBy === 'string' &&
    typeof value.date === 'string' &&
    isExpenseCategory(value.category) &&
    isSplit(value.split)
  );
}

export function isTripData(value: unknown): value is TripData {
  if (!isRecord(value)) {
    return false;
  }
  if (!Array.isArray(value.members) || !Array.isArray(value.expenses)) {
    return false;
  }
  return value.members.every(isMember) && value.expenses.every(isExpense);
}

export function getSampleTripData(): TripData {
  const raw: unknown = sampleDataJson;
  if (!isTripData(raw)) {
    throw new Error('Bundled sample-data.json failed schema validation.');
  }
  return {
    members: raw.members.map((member) => ({ ...member })),
    expenses: raw.expenses.map((expense) => ({ ...expense })),
  };
}
