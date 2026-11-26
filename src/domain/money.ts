export type MoneyParseError = 'empty' | 'invalid_format' | 'too_many_decimals' | 'out_of_range';

export type MoneyParseResult =
  | { ok: true; paise: number }
  | { ok: false; error: MoneyParseError };

export type PercentParseResult =
  | { ok: true; basisPoints: number }
  | { ok: false; error: MoneyParseError };

const DECIMAL_NUMBER_PATTERN = /^-?(?:\d+(?:\.\d+)?|\.\d+)$/;

/**
 * Parses a decimal string (up to 2 fractional digits) into scaled integers
 * using string splitting so floating-point multiplication errors never occur.
 */
function parseScaledDecimal(
  raw: string,
  scaleDigits: 2,
): { ok: true; value: number } | { ok: false; error: MoneyParseError } {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { ok: false, error: 'empty' };
  }

  if (!DECIMAL_NUMBER_PATTERN.test(trimmed)) {
    return { ok: false, error: 'invalid_format' };
  }

  const isNegative = trimmed.startsWith('-');
  const unsigned = isNegative ? trimmed.slice(1) : trimmed;
  const parts = unsigned.split('.');
  const wholePart = parts[0] ?? '';
  const fractionPart = parts[1] ?? '';

  if (fractionPart.length > scaleDigits) {
    return { ok: false, error: 'too_many_decimals' };
  }

  const scaleFactor = 10 ** scaleDigits;
  const wholeUnits = Number(wholePart === '' ? '0' : wholePart) * scaleFactor;
  const fractionUnits = Number(fractionPart.padEnd(scaleDigits, '0'));
  const magnitude = wholeUnits + fractionUnits;

  if (!Number.isSafeInteger(magnitude)) {
    return { ok: false, error: 'out_of_range' };
  }

  if (magnitude === 0) {
    return { ok: true, value: 0 };
  }

  return { ok: true, value: isNegative ? -magnitude : magnitude };
}

/**
 * Parses a rupee string (e.g. "1250.50", ".5", "-25") into integer paise.
 */
export function parseRupeesToPaise(raw: string): MoneyParseResult {
  const result = parseScaledDecimal(raw, 2);
  if (!result.ok) {
    return result;
  }
  return { ok: true, paise: result.value };
}

/**
 * Parses a percentage string (up to 2 decimals) into integer basis points
 * where 100.00% = 10000 basis points.
 */
export function parsePercentToBasisPoints(raw: string): PercentParseResult {
  const result = parseScaledDecimal(raw, 2);
  if (!result.ok) {
    return result;
  }
  return { ok: true, basisPoints: result.value };
}

const indianIntegerFormatter = new Intl.NumberFormat('en-IN');

/**
 * Formats integer paise into Indian Rupee notation (e.g. 10000000 -> "₹1,00,000.00").
 */
export function formatPaise(paise: number): string {
  if (!Number.isSafeInteger(paise)) {
    throw new Error(`Expected integer paise, received: ${String(paise)}`);
  }

  const sign = paise < 0 ? '-' : '';
  const absPaise = Math.abs(paise);
  const wholeRupees = Math.floor(absPaise / 100);
  const remainderPaise = absPaise % 100;

  const formattedWhole = indianIntegerFormatter.format(wholeRupees);
  const formattedFraction = String(remainderPaise).padStart(2, '0');

  return `${sign}₹${formattedWhole}.${formattedFraction}`;
}

/**
 * Formats the absolute magnitude of integer paise in Indian Rupee notation.
 */
export function formatPaiseAbsolute(paise: number): string {
  return formatPaise(Math.abs(paise));
}
