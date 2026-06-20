export function parsePositiveAmount(raw: string): number | null {
  const parsed = parseFloat(raw);
  if (Number.isNaN(parsed) || parsed <= 0) return null;
  return parsed;
}

export function requireTrimmedName(name: string): string | null {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : null;
}

if (__DEV__) {
  console.assert(parsePositiveAmount('12.5') === 12.5);
  console.assert(parsePositiveAmount('0') === null);
  console.assert(requireTrimmedName('  x ') === 'x');
  console.assert(requireTrimmedName('  ') === null);
}
