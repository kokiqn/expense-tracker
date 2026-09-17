// debt-simplifier.test.ts
import { describe, it, expect } from "vitest";
import { computeNetBalance, computeTransactions, getCreditorsAndDebtors, simplifyDebts } from "./debt-simplifier";
import type { ExpenseSplit, ExpensePayment } from "../types";
import { allPayments, allSplits, payments1, payments3, splits1, splits3 } from "./mock-data.ts";

describe("debt simplifier", () => {
  describe("computeNetBalance", () => {
    const makeSplit = (trip_member_id: string, amount: number): ExpenseSplit => ({
      id: `split-${trip_member_id}-${amount}`,
      expense_id: "e1",
      trip_member_id,
      amount,
      created_at: new Date(),
    });

    const makePayment = (trip_member_id: string, amount: number): ExpensePayment => ({
      id: `payment-${trip_member_id}-${amount}`,
      expense_id: "e1",
      trip_member_id,
      amount,
      created_at: new Date(),
    });

    it("returns an empty map when there are no splits and payments", () => {
      const result = computeNetBalance([], []);
      expect(result.size).toBe(0);
    });

    it("computes balance for a member who only has splits (owes, never paid)", () => {
      const result = computeNetBalance([makeSplit("m1", 1000)], []);
      expect(result.get("m1")).toEqual({ isOwed: 0, owes: 1000, net: -1000 });
    });

    it("computes balance for a member who only has payments (paid, never owes)", () => {
      const result = computeNetBalance([], [makePayment("m1", 1000)]);
      expect(result.get("m1")).toEqual({ isOwed: 1000, owes: 0, net: 1000 });
    });

    it("combines splits and payments for a member who both paid and owes", () => {
      // e.g. someone who fronted money for an expense they also consumed
      const result = computeNetBalance([makeSplit("m1", 400)], [makePayment("m1", 1200)]);
      expect(result.get("m1")).toEqual({ isOwed: 1200, owes: 400, net: 800 });
    });

    it("sums multiple splits for the same member instead of overwriting", () => {
      const result = computeNetBalance([makeSplit("m1", 300), makeSplit("m1", 700)], []);
      expect(result.get("m1")).toEqual({ isOwed: 0, owes: 1000, net: -1000 });
    });

    it("sums multiple payments for the same member instead of overwriting", () => {
      const result = computeNetBalance([], [makePayment("m1", 500), makePayment("m1", 500)]);
      expect(result.get("m1")).toEqual({ isOwed: 1000, owes: 0, net: 1000 });
    });

    it("keeps balances independent across different members", () => {
      const result = computeNetBalance([makeSplit("m1", 1000), makeSplit("m2", 500)], [makePayment("m2", 500)]);
      expect(result.get("m1")).toEqual({ isOwed: 0, owes: 1000, net: -1000 });
      expect(result.get("m2")).toEqual({ isOwed: 500, owes: 500, net: 0 });
    });
  });

  describe("getCreditorsAndDebtors", () => {
    it("returns empty arrays when there are no balances", () => {
      const result = getCreditorsAndDebtors(new Map());
      expect(result.creditors).toEqual([]);
      expect(result.debtors).toEqual([]);
    });

    it("categorizes members correctly based on their net balance", () => {
      const balances = new Map([
        ["m1", { isOwed: 0, owes: 1000, net: -1000 }], // debtor
        ["m2", { isOwed: 500, owes: 500, net: 0 }], // neutral
        ["m3", { isOwed: 1500, owes: 500, net: 1000 }], // creditor
      ]);

      const result = getCreditorsAndDebtors(balances);
      expect(result.creditors).toEqual([{ trip_member_id: "m3", amount: 1000 }]);
      expect(result.debtors).toEqual([{ trip_member_id: "m1", amount: 1000 }]);
    });
  });

  describe("computeTransactions", () => {
    it("returns an empty array when there are no creditors or debtors", () => {
      const result = computeTransactions([], []);
      expect(result).toEqual([]);
    });

    it("operates with copies of the input arrays and does not mutate them", () => {
      const creditors = [{ trip_member_id: "m1", amount: 1000 }];
      const debtors = [{ trip_member_id: "m2", amount: 1000 }];
      // Make copies of the original arrays to compare later
      const creditorsCopy = [...creditors];
      const debtorsCopy = [...debtors];

      computeTransactions(creditors, debtors);

      expect(creditors).toEqual(creditorsCopy);
      expect(debtors).toEqual(debtorsCopy);
    });

    it("computes transactions correctly for a simple case", () => {
      const creditors = [{ trip_member_id: "m1", amount: 1000 }];
      const debtors = [{ trip_member_id: "m2", amount: 1000 }];

      const result = computeTransactions(creditors, debtors);
      expect(result).toEqual([{ paid_by: "m2", paid_to: "m1", amount: 1000 }]);
    });

    it("computes transactions correctly when a debtor owes less than a creditor is owed", () => {
      const creditors = [{ trip_member_id: "m1", amount: 1000 }];
      const debtors = [
        { trip_member_id: "m2", amount: 500 },
        { trip_member_id: "m3", amount: 500 },
      ];

      const result = computeTransactions(creditors, debtors);
      expect(result).toEqual([
        { paid_by: "m2", paid_to: "m1", amount: 500 },
        { paid_by: "m3", paid_to: "m1", amount: 500 },
      ]);
    });

    it("computes transactions correctly when a debtor owes more than a creditor is owed", () => {
      const creditors = [
        { trip_member_id: "m1", amount: 500 },
        { trip_member_id: "m2", amount: 500 },
      ];
      const debtors = [{ trip_member_id: "m3", amount: 1000 }];

      const result = computeTransactions(creditors, debtors);
      expect(result).toEqual([
        { paid_by: "m3", paid_to: "m1", amount: 500 },
        { paid_by: "m3", paid_to: "m2", amount: 500 },
      ]);
    });

    it("computes transactions correctly for complex cases with multiple creditors and debtors", () => {
      const creditors = [
        { trip_member_id: "m1", amount: 1000 },
        { trip_member_id: "m2", amount: 500 },
        { trip_member_id: "m3", amount: 300 },
      ];
      const debtors = [
        { trip_member_id: "m4", amount: 800 },
        { trip_member_id: "m5", amount: 700 },
        { trip_member_id: "m6", amount: 300 },
      ];

      const result = computeTransactions(creditors, debtors);
      expect(result).toEqual([
        { paid_by: "m4", paid_to: "m1", amount: 800 },
        { paid_by: "m5", paid_to: "m2", amount: 500 },
        { paid_by: "m6", paid_to: "m3", amount: 300 },
        { paid_by: "m5", paid_to: "m1", amount: 200 },
      ]);
    });
  });

  describe("integration test for debt simplification", () => {
    it("simplifies multiple debts correctly for a realistic scenario", () => {
      const { transactions } = simplifyDebts(allSplits, allPayments);

      expect(transactions).toEqual([
        { paid_by: "m4", paid_to: "m1", amount: 1900 },
        { paid_by: "m2", paid_to: "m1", amount: 700 },
        { paid_by: "m2", paid_to: "m3", amount: 200 },
      ]);
    });

    it("simplifies a single expense correctly where the creditor is also a consumer", () => {
      const { transactions } = simplifyDebts(splits1, payments1);

      expect(transactions).toEqual([
        { paid_by: "m2", paid_to: "m1", amount: 1000 },
        { paid_by: "m3", paid_to: "m1", amount: 1000 },
        { paid_by: "m4", paid_to: "m1", amount: 1000 },
      ]);
    });

    it("simplifies a single expense correctly where the creditor is not a consumer", () => {
      const { transactions } = simplifyDebts(splits3, payments3);

      expect(transactions).toEqual([
        { paid_by: "m1", paid_to: "m3", amount: 400 },
        { paid_by: "m2", paid_to: "m3", amount: 400 },
        { paid_by: "m4", paid_to: "m3", amount: 400 },
      ]);
    });
  });
});
