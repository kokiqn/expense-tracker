import type { ExpensePayment, ExpenseSplit } from "../types";

export type Balance = { isOwed: number; owes: number; net: number };
export type Balances = Map<string, Balance>;
type Share = { trip_member_id: string; amount: number };
type Transaction = {
  paid_by: string;
  paid_to: string;
  amount: number;
}

export function computeNetBalance(splits: ExpenseSplit[], payments: ExpensePayment[]): Balances {
  const balances: Map<string, Balance> = new Map();

  const getOrCreate = (memberId: string): Balance => {
    if (!balances.has(memberId)) balances.set(memberId, { isOwed: 0, owes: 0, net: 0 });
    return balances.get(memberId)!;
  };

  for (const { trip_member_id, amount } of splits) {
    const balance = getOrCreate(trip_member_id);
    balance.owes += amount;
    balance.net -= amount;
  }

  for (const { trip_member_id, amount } of payments) {
    const balance = getOrCreate(trip_member_id);
    balance.isOwed += amount;
    balance.net += amount;
  }

  return balances;
}

export function getCreditorsAndDebtors(balances: Balances) {
  const creditors: Share[] = [];
  const debtors: Share[] = [];

  balances.forEach((bal, trip_member_id) => {
    const share = { trip_member_id, amount: Math.abs(bal.net) };
    if (bal.net > 0) {
      creditors.push(share);
    } else if (bal.net < 0) {
      debtors.push(share);
    }
  });

  return {
    creditors,
    debtors,
  };
}

export function computeTransactions(creditors: Share[], debtors: Share[]) {
  const transactions: Transaction[] = [];
  const sortedCreditors = [...creditors];
  const sortedDebtors = [...debtors];

  while (sortedCreditors.length > 0 && sortedDebtors.length > 0) {
    sortedCreditors.sort((a, b) => b.amount - a.amount);
    sortedDebtors.sort((a, b) => b.amount - a.amount);

    const creditor = sortedCreditors.shift() as Share;
    const debtor = sortedDebtors.shift() as Share;

    if (creditor.amount > debtor.amount) {
      const newAmount = creditor.amount - debtor.amount;
      sortedCreditors.push({ ...creditor, amount: newAmount });
      transactions.push({
        paid_by: debtor.trip_member_id,
        paid_to: creditor.trip_member_id,
        amount: debtor.amount,
      });
    } else {
      const newAmount = debtor.amount - creditor.amount;
      sortedDebtors.push({ ...debtor, amount: newAmount });
      transactions.push({
        paid_by: debtor.trip_member_id,
        paid_to: creditor.trip_member_id,
        amount: creditor.amount,
      })
    }
  }
  
  return transactions;
}

export function simplifyDebts(allSplits: ExpenseSplit[], allPayments: ExpensePayment[]) {
  const balances = computeNetBalance(allSplits, allPayments);
  const { creditors, debtors } = getCreditorsAndDebtors(balances);
  const transactions = computeTransactions(creditors, debtors);

  return {
    transactions,
  }
}
