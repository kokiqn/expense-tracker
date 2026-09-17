// mockData.ts
import type { TripMember, Expense, ExpenseSplit, ExpensePayment } from "../types";

export const members: TripMember[] = [
  { id: "m1", trip_id: "t1", user_id: "u1", display_name: "Alice", joined_at: new Date() },
  { id: "m2", trip_id: "t1", user_id: "u2", display_name: "Bob",   joined_at: new Date() },
  { id: "m3", trip_id: "t1", user_id: null, display_name: "Cara",  joined_at: new Date() },
  { id: "m4", trip_id: "t1", user_id: "u4", display_name: "Dan",   joined_at: new Date() },
];

// Expense 1: Alice pays €40 for dinner, split equally 4 ways (1000 cents each)
export const expense1: Expense = {
  id: "e1", trip_id: "t1", amount: 4000, description: "Dinner", share_type: "equal", created_by: "m1", created_at: new Date(),
};
export const payments1: ExpensePayment[] = [
  { id: "p1", expense_id: "e1", trip_member_id: "m1", amount: 4000, created_at: new Date() },
];
export const splits1: ExpenseSplit[] = [
  { id: "s1", expense_id: "e1", trip_member_id: "m1", amount: 1000, created_at: new Date() },
  { id: "s2", expense_id: "e1", trip_member_id: "m2", amount: 1000, created_at: new Date() },
  { id: "s3", expense_id: "e1", trip_member_id: "m3", amount: 1000, created_at: new Date() },
  { id: "s4", expense_id: "e1", trip_member_id: "m4", amount: 1000, created_at: new Date() },
];

// Expense 2: Multi-payer taxi — Bob pays €20, Dan pays €10, exact split (Bob & Dan only, Alice/Cara didn't ride)
export const expense2: Expense = {
  id: "e2", trip_id: "t1", amount: 3000, description: "Taxi", share_type: "exact", created_by: "m2", created_at: new Date(),
};
export const payments2: ExpensePayment[] = [
  { id: "p2", expense_id: "e2", trip_member_id: "m2", amount: 2000, created_at: new Date() },
  { id: "p3", expense_id: "e2", trip_member_id: "m4", amount: 1000, created_at: new Date() },
];
export const splits2: ExpenseSplit[] = [
  { id: "s5", expense_id: "e2", trip_member_id: "m2", amount: 1500, created_at: new Date() },
  { id: "s6", expense_id: "e2", trip_member_id: "m4", amount: 1500, created_at: new Date() },
];

// Expense 3: Cara treats everyone to coffee (€12), she doesn't drink any herself — split among m1, m2, m4 only
export const expense3: Expense = {
  id: "e3", trip_id: "t1", amount: 1200, description: "Coffee", share_type: "equal", created_by: "m3", created_at: new Date(),
};
export const payments3: ExpensePayment[] = [
  { id: "p4", expense_id: "e3", trip_member_id: "m3", amount: 1200, created_at: new Date() },
];
export const splits3: ExpenseSplit[] = [
  { id: "s7", expense_id: "e3", trip_member_id: "m1", amount: 400, created_at: new Date() },
  { id: "s8", expense_id: "e3", trip_member_id: "m2", amount: 400, created_at: new Date() },
  { id: "s9", expense_id: "e3", trip_member_id: "m4", amount: 400, created_at: new Date() },
];

// Combined, ready to feed straight into computeNetBalance
export const allPayments = [...payments1, ...payments2, ...payments3];
export const allSplits = [...splits1, ...splits2, ...splits3];
