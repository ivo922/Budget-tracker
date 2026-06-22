import { convertBudgeCsvToBackup, parseCsv } from '@/lib/dataTransfer/budgeCsv';
import { parseBackupJson } from '@/lib/dataTransfer/validate';

describe('parseCsv', () => {
  it('handles quoted commas', () => {
    expect(parseCsv('a,b\n"Acme, Inc.",10')).toEqual([
      ['a', 'b'],
      ['Acme, Inc.', '10'],
    ]);
  });
});

describe('convertBudgeCsvToBackup', () => {
  it('maps Budge-style columns into BackupFile', () => {
    const csv = [
      'Date,Payee,Amount,Currency,Category,Account,Notes',
      '2026-02-01,Electric Co,120.50,USD,Utilities,Checking,Monthly bill',
      '2026-03-01,Client A,5000.00,USD,Salary,Checking,Retainer',
    ].join('\n');

    const backup = convertBudgeCsvToBackup(csv, '2026-06-22T00:00:00.000Z');
    expect(() => parseBackupJson(JSON.stringify(backup))).not.toThrow();
    expect(backup.accounts).toHaveLength(1);
    expect(backup.accounts[0].name).toBe('Checking');
    expect(backup.transactions).toHaveLength(2);
    expect(backup.transactions.find((row) => row.type === 'expense')?.amount).toBe(120.5);
    expect(backup.transactions.find((row) => row.type === 'income')?.amount).toBe(5000);
    expect(backup.categories.some((row) => row.name === 'Utilities')).toBe(true);
    expect(backup.categories.some((row) => row.name === 'Salary')).toBe(true);
  });

  it('supports debit/credit bank exports', () => {
    const csv = [
      'Date,Description,Debit,Credit,Balance',
      '02/01/2026,Coffee shop,4.50,,1000',
      '02/02/2026,Paycheck,,2000,3000',
    ].join('\n');

    const backup = convertBudgeCsvToBackup(csv);
    expect(backup.transactions).toHaveLength(2);
    expect(backup.transactions[0].type).toBe('expense');
    expect(backup.transactions[0].amount).toBe(4.5);
    expect(backup.transactions[1].type).toBe('income');
    expect(backup.transactions[1].amount).toBe(2000);
  });

  it('supports Budge native multi-section export', () => {
    const csv = [
      'Format version,Period,User ID',
      '1,21-06-2025..21-06-2026,user',
      '###',
      'Date,Payment,Is paid,Amount,Currency,Account,Category,Subcategory,Goal,Description',
      '05-01-2026,Salary,true,744.92,EUR,Checking,Salary,,,',
      '06-01-2026,Rent,true,-370,EUR,Checking,House,,,',
      '15-01-2026,Transfer out,true,-100,EUR,Checking,Transfer,,,',
      '15-01-2026,Transfer in,true,100,EUR,Savings,Transfer,,,',
      '###',
      'Account,Account Balance,Available Balance,Credit Limit,Currency,Is savings,Description',
      'Checking,674.92,674.92,0,EUR,false,',
      'Savings,100,100,0,EUR,false,',
      '###',
      'Goal,Required sum,Required sum currency,Accumulated sum,Accumulated sum currency,Planned expense date,Category,Subcategory,Description',
      'Vacation,1000,EUR,200,EUR,01-07-2026,Travel,,',
    ].join('\n');

    const backup = convertBudgeCsvToBackup(csv);
    expect(() => parseBackupJson(JSON.stringify(backup))).not.toThrow();
    expect(backup.accounts).toHaveLength(2);
    expect(backup.transactions).toHaveLength(3);
    expect(backup.transactions.some((row) => row.type === 'transfer')).toBe(true);
    expect(backup.goals).toHaveLength(1);
    expect(backup.goals[0].name).toBe('Vacation');
  });
});
