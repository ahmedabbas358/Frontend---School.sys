import { useMemo } from 'react';
import { useGlobalStore } from '@/contexts/GlobalStoreContext';

export function useLedger() {
  const { journalEntries, journalLines, accounts } = useGlobalStore();

  // Get only posted lines
  const postedLines = useMemo(() => {
    const postedEntryIds = new Set(journalEntries.filter(e => e.status === 'posted').map(e => e.id));
    return journalLines.filter(line => postedEntryIds.has(line.journalEntryId));
  }, [journalEntries, journalLines]);

  // Calculate balance for a specific account
  const getAccountBalance = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return 0;

    let balance = 0;
    
    // If it's a group account, sum up all children balances recursively
    if (account.isGroupAccount) {
      const children = accounts.filter(a => a.parentId === accountId);
      for (const child of children) {
        balance += getAccountBalance(child.id);
      }
      return balance;
    }

    // Direct account balance calculation
    const lines = postedLines.filter(l => l.accountId === accountId);
    const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);

    // Normal balance logic
    if (account.normalBalance === 'debit' || account.type === 'asset' || account.type === 'expense') {
      balance = totalDebit - totalCredit;
    } else {
      balance = totalCredit - totalDebit;
    }

    return balance;
  };

  // Get entity balance (Student, Vendor, Employee)
  // Positive means they owe us (Receivable), Negative means we owe them (Payable)
  const getEntityBalance = (entityId: string, entityType?: string) => {
    const lines = postedLines.filter(l => l.studentId === entityId || l.referenceId === entityId);
    
    let balance = 0;
    // We assume entity balances are primarily tracked in AP/AR accounts
    lines.forEach(line => {
      const account = accounts.find(a => a.id === line.accountId);
      if (account) {
        if (account.type === 'asset') { // AR
          balance += (line.debit || 0) - (line.credit || 0);
        } else if (account.type === 'liability') { // AP
          balance -= (line.credit || 0) - (line.debit || 0); // We owe them
        }
      }
    });

    return balance;
  };

  // Get full trial balance
  const getTrialBalance = () => {
    return accounts.map(account => {
      const balance = getAccountBalance(account.id);
      return {
        ...account,
        balance,
        isDebit: (account.normalBalance === 'debit' || account.type === 'asset' || account.type === 'expense') ? balance > 0 : balance < 0,
      };
    });
  };

  return {
    getAccountBalance,
    getEntityBalance,
    getTrialBalance,
    postedLines,
  };
}
