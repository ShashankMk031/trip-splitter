import type { Expense, Member, Split } from '../types/expense';

const TOTAL_BASIS_POINTS = 10000;

function buildMemberOrderMap(members: readonly Member[]): Map<string, number> {
  const orderMap = new Map<string, number>();
  members.forEach((member, index) => {
    orderMap.set(member.id, index);
  });
  return orderMap;
}

/**
 * Converts a finite percentage (with at most 2 decimals) to integer basis points.
 */
function percentToBasisPoints(percent: number): number {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new Error(`Invalid percentage value: ${String(percent)}`);
  }

  const scaled = percent * 100;
  const rounded = Math.round(scaled);
  if (Math.abs(scaled - rounded) > 1e-6) {
    throw new Error(`Percentage supports at most 2 decimal places: ${String(percent)}`);
  }

  return rounded;
}

function allocateEqualSplit(
  amountPaise: number,
  memberIds: readonly string[],
  orderMap: ReadonlyMap<string, number>,
): Record<string, number> {
  const uniqueSelected = new Set(memberIds);
  for (const id of uniqueSelected) {
    if (!orderMap.has(id)) {
      throw new Error(`Unknown member in equal split: ${id}`);
    }
  }

  // Canonical participant ordering follows trip members array order so extra paise
  // are distributed deterministically regardless of selection order.
  const orderedParticipants = [...uniqueSelected].sort((a, b) => {
    const indexA = orderMap.get(a) ?? Number.MAX_SAFE_INTEGER;
    const indexB = orderMap.get(b) ?? Number.MAX_SAFE_INTEGER;
    return indexA - indexB;
  });

  if (orderedParticipants.length === 0) {
    throw new Error('Equal split requires at least one participating member.');
  }

  const count = orderedParticipants.length;
  const baseShare = Math.floor(amountPaise / count);
  const remainder = amountPaise % count;

  const shares: Record<string, number> = {};
  orderedParticipants.forEach((memberId, index) => {
    shares[memberId] = baseShare + (index < remainder ? 1 : 0);
  });

  return shares;
}

function allocateExactSplit(
  amountPaise: number,
  rawShares: Readonly<Record<string, number>>,
  orderMap: ReadonlyMap<string, number>,
): Record<string, number> {
  const shares: Record<string, number> = {};
  let sum = 0;

  for (const [memberId, sharePaise] of Object.entries(rawShares)) {
    if (!orderMap.has(memberId)) {
      throw new Error(`Unknown member in exact split: ${memberId}`);
    }
    if (!Number.isInteger(sharePaise) || sharePaise < 0) {
      throw new Error(`Exact share must be a non-negative integer in paise: ${String(sharePaise)}`);
    }
    shares[memberId] = sharePaise;
    sum += sharePaise;
  }

  if (sum !== amountPaise) {
    throw new Error(
      `Exact split total (${String(sum)}) does not match expense amount (${String(amountPaise)}).`,
    );
  }

  return shares;
}

interface PercentAllocationCandidate {
  memberId: string;
  orderIndex: number;
  basePaise: number;
  remainderUnit: number;
}

function allocatePercentSplit(
  amountPaise: number,
  rawShares: Readonly<Record<string, number>>,
  orderMap: ReadonlyMap<string, number>,
): Record<string, number> {
  const candidates: PercentAllocationCandidate[] = [];
  let totalBasisPoints = 0;

  for (const [memberId, percent] of Object.entries(rawShares)) {
    const orderIndex = orderMap.get(memberId);
    if (orderIndex === undefined) {
      throw new Error(`Unknown member in percent split: ${memberId}`);
    }

    const basisPoints = percentToBasisPoints(percent);
    totalBasisPoints += basisPoints;

    const numerator = amountPaise * basisPoints;
    const basePaise = Math.floor(numerator / TOTAL_BASIS_POINTS);
    const remainderUnit = numerator % TOTAL_BASIS_POINTS;

    candidates.push({
      memberId,
      orderIndex,
      basePaise,
      remainderUnit,
    });
  }

  if (totalBasisPoints !== TOTAL_BASIS_POINTS) {
    throw new Error(
      `Percent split total (${String(totalBasisPoints / 100)}%) must equal 100%.`,
    );
  }

  const allocatedBase = candidates.reduce((acc, item) => acc + item.basePaise, 0);
  const leftoverPaise = amountPaise - allocatedBase;

  // Largest Remainder Method (Hamilton method) with deterministic tie-breaking
  // by trip member array order.
  const rankedForRemainder = [...candidates].sort((a, b) => {
    if (b.remainderUnit !== a.remainderUnit) {
      return b.remainderUnit - a.remainderUnit;
    }
    return a.orderIndex - b.orderIndex;
  });

  const bonusRecipientIds = new Set(
    rankedForRemainder.slice(0, leftoverPaise).map((candidate) => candidate.memberId),
  );

  const shares: Record<string, number> = {};
  candidates
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .forEach((candidate) => {
      shares[candidate.memberId] =
        candidate.basePaise + (bonusRecipientIds.has(candidate.memberId) ? 1 : 0);
    });

  return shares;
}

/**
 * Computes exact integer-paise shares per member for an expense.
 * Guarantees that total allocated paise strictly equals expense.amount.
 */
export function calculateExpenseShares(
  expense: Pick<Expense, 'amount' | 'split'>,
  members: readonly Member[],
): Record<string, number> {
  if (!Number.isInteger(expense.amount) || expense.amount <= 0) {
    throw new Error(`Expense amount must be a positive integer in paise: ${String(expense.amount)}`);
  }

  const orderMap = buildMemberOrderMap(members);
  const { split } = expense;

  switch (split.type) {
    case 'equal':
      return allocateEqualSplit(expense.amount, split.memberIds, orderMap);
    case 'exact':
      return allocateExactSplit(expense.amount, split.shares, orderMap);
    case 'percent':
      return allocatePercentSplit(expense.amount, split.shares, orderMap);
  }
}

/**
 * Formats a human-readable split summary label (e.g. "Equally, 4 people").
 */
export function formatSplitSummary(split: Split): string {
  switch (split.type) {
    case 'equal': {
      const count = new Set(split.memberIds).size;
      return `Equally, ${String(count)} ${count === 1 ? 'person' : 'people'}`;
    }
    case 'exact': {
      const nonZeroCount = Object.values(split.shares).filter((amount) => amount > 0).length;
      const count = nonZeroCount > 0 ? nonZeroCount : Object.keys(split.shares).length;
      return `Exact, ${String(count)} ${count === 1 ? 'person' : 'people'}`;
    }
    case 'percent': {
      const nonZeroCount = Object.values(split.shares).filter((pct) => pct > 0).length;
      const count = nonZeroCount > 0 ? nonZeroCount : Object.keys(split.shares).length;
      return `Percent, ${String(count)} ${count === 1 ? 'person' : 'people'}`;
    }
  }
}
