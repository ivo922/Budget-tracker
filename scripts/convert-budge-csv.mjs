#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

async function main() {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath || !outputPath) {
    console.error('Usage: node scripts/convert-budge-csv.mjs <budge.csv> <output.json>');
    process.exit(1);
  }

  const { register } = await import('tsx/esm/api');
  register();

  const { convertBudgeCsvToBackup } = await import('../lib/dataTransfer/budgeCsv.ts');
  const { parseBackupJson } = await import('../lib/dataTransfer/validate.ts');

  const csv = readFileSync(inputPath, 'utf8');
  const backup = convertBudgeCsvToBackup(csv);
  parseBackupJson(JSON.stringify(backup));
  writeFileSync(outputPath, `${JSON.stringify(backup)}\n`);
  console.log(
    `Wrote ${outputPath} (${backup.transactions.length} transactions, ${backup.accounts.length} accounts, ${backup.categories.length} categories)`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
