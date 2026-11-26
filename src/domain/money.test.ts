import { describe, expect, it } from 'vitest';
import {
  formatPaise,
  formatPaiseAbsolute,
  parsePercentToBasisPoints,
  parseRupeesToPaise,
} from './money';

describe('parseRupeesToPaise', () => {
  it('parses integer and decimal rupee strings into exact integer paise', () => {
    expect(parseRupeesToPaise('1250.50')).toEqual({ ok: true, paise: 125050 });
    expect(parseRupeesToPaise('19.99')).toEqual({ ok: true, paise: 1999 });
    expect(parseRupeesToPaise('100')).toEqual({ ok: true, paise: 10000 });
    expect(parseRupeesToPaise('1000000.00')).toEqual({ ok: true, paise: 100000000 });
    expect(parseRupeesToPaise('.5')).toEqual({ ok: true, paise: 50 });
    expect(parseRupeesToPaise('  42.5  ')).toEqual({ ok: true, paise: 4250 });
  });

  it('handles zero and negative numbers cleanly without -0', () => {
    expect(parseRupeesToPaise('0')).toEqual({ ok: true, paise: 0 });
    expect(parseRupeesToPaise('0.00')).toEqual({ ok: true, paise: 0 });
    expect(parseRupeesToPaise('-0.00')).toEqual({ ok: true, paise: 0 });
    expect(parseRupeesToPaise('-25.75')).toEqual({ ok: true, paise: -2575 });
  });

  it('rejects empty, malformed, and over-precision inputs', () => {
    expect(parseRupeesToPaise('')).toEqual({ ok: false, error: 'empty' });
    expect(parseRupeesToPaise('   ')).toEqual({ ok: false, error: 'empty' });
    expect(parseRupeesToPaise('10.123')).toEqual({ ok: false, error: 'too_many_decimals' });
    expect(parseRupeesToPaise('10.')).toEqual({ ok: false, error: 'invalid_format' });
    expect(parseRupeesToPaise('abc')).toEqual({ ok: false, error: 'invalid_format' });
    expect(parseRupeesToPaise('1e5')).toEqual({ ok: false, error: 'invalid_format' });
    expect(parseRupeesToPaise('1,250.50')).toEqual({ ok: false, error: 'invalid_format' });
  });
});

describe('parsePercentToBasisPoints', () => {
  it('parses percentages into integer basis points', () => {
    expect(parsePercentToBasisPoints('33.33')).toEqual({ ok: true, basisPoints: 3333 });
    expect(parsePercentToBasisPoints('33.34')).toEqual({ ok: true, basisPoints: 3334 });
    expect(parsePercentToBasisPoints('100')).toEqual({ ok: true, basisPoints: 10000 });
    expect(parsePercentToBasisPoints('0.5')).toEqual({ ok: true, basisPoints: 50 });
  });

  it('rejects >2 decimal places or invalid format', () => {
    expect(parsePercentToBasisPoints('33.333')).toEqual({ ok: false, error: 'too_many_decimals' });
    expect(parsePercentToBasisPoints('')).toEqual({ ok: false, error: 'empty' });
  });
});

describe('formatPaise & formatPaiseAbsolute', () => {
  it('formats paise using Indian numbering system', () => {
    expect(formatPaise(0)).toBe('₹0.00');
    expect(formatPaise(5)).toBe('₹0.05');
    expect(formatPaise(125050)).toBe('₹1,250.50');
    expect(formatPaise(10000000)).toBe('₹1,00,000.00');
    expect(formatPaise(100000000)).toBe('₹10,00,000.00');
    expect(formatPaise(-369578)).toBe('-₹3,695.78');
    expect(formatPaiseAbsolute(-369578)).toBe('₹3,695.78');
  });

  it('throws on non-integer paise', () => {
    expect(() => formatPaise(12.5)).toThrow();
  });
});
