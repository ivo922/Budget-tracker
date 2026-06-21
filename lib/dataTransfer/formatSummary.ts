import type { ImportSummary, TableCounts } from './types';

function sumCounts(counts: TableCounts): number {
  return (
    counts.accounts +
    counts.categories +
    counts.goals +
    counts.transactions +
    counts.budgets +
    counts.settings
  );
}

export function formatImportSummary(summary: ImportSummary): string {
  const inserted = sumCounts(summary.inserted);
  const updated = sumCounts(summary.updated);
  const skipped = sumCounts(summary.skipped);
  const lines = [
    `Added: ${inserted}`,
    `Updated: ${updated}`,
    `Skipped: ${skipped}`,
  ];
  if (summary.warnings.length > 0) {
    lines.push('', ...summary.warnings.slice(0, 5));
    if (summary.warnings.length > 5) {
      lines.push(`…and ${summary.warnings.length - 5} more warnings`);
    }
  }
  return lines.join('\n');
}
