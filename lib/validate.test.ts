import { parsePositiveAmount, requireTrimmedName } from './validate';

describe('parsePositiveAmount', () => {
  it('parses valid positive numbers', () => {
    expect(parsePositiveAmount('12.5')).toBe(12.5);
    expect(parsePositiveAmount('100')).toBe(100);
  });

  it('rejects zero, negative, NaN, and empty', () => {
    expect(parsePositiveAmount('0')).toBeNull();
    expect(parsePositiveAmount('-5')).toBeNull();
    expect(parsePositiveAmount('abc')).toBeNull();
    expect(parsePositiveAmount('')).toBeNull();
  });
});

describe('requireTrimmedName', () => {
  it('trims and returns non-empty names', () => {
    expect(requireTrimmedName('  savings  ')).toBe('savings');
  });

  it('returns null for blank names', () => {
    expect(requireTrimmedName('   ')).toBeNull();
    expect(requireTrimmedName('')).toBeNull();
  });
});
