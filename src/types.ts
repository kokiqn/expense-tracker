interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: Date;
}

interface Trip {
  id: string;
  name: string;
  base_currency: string; // e.g. "USD"
  invite_code: string; // short unique token for the shareable link
  created_by: User;
  created_at: Date;
}

interface TripMember {
  id: string;
  trip_id: string;
  user_id: string | null;
  display_name: string;
  joined_at: Date;
}

interface Expense {
  id: string;
  trip_id: string;
  amount: number; // store as integer cents, never float
  share_type: 'equal' | 'exact'; // | 'percentage' | 'shares';
  description: string;
  created_by: string;
  created_at: Date;
}

interface ExpensePayment {
  id: string;
  expense_id: string;
  trip_member_id: string;
  amount: number; // store as integer cents, never float
  created_at: Date;
}

interface ExpenseSplit {
  id: string;
  expense_id: string;
  trip_member_id: string;
  amount: number; // store as integer cents, never float,
  created_at: Date;
}

interface Settlement {
  id: string;
  trip_id: string;
  from_member: TripMember; // who paid
  to_member: TripMember; // who received
  amount: number; // store as integer cents, never float
  settled_at: Date;
  note?: string; // optional, e.g. "paid via Venmo"
}

export type {
  User,
  Trip,
  TripMember,
  Expense,
  ExpensePayment,
  ExpenseSplit,
  Settlement,
}
