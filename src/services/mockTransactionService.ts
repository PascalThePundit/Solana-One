import { useAppStore } from "../store/useAppStore";

export interface TransactionSummary {
  id: string;
  type: "Transfer" | "Interaction" | "Approval";
  target: string;
  amount?: string;
  fee: string;
  risk: "low" | "medium" | "high";
  description: string;
}

export const mockTransactionService = {
  async simulateTransaction(
    type: "Transfer" | "Interaction",
  ): Promise<TransactionSummary> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Math.random().toString(36).substr(2, 9),
          type,
          target: "8xK...3pQ",
          amount: type === "Transfer" ? "1.5 SOL" : undefined,
          fee: "0.000005 SOL",
          risk: Math.random() > 0.7 ? "medium" : "low",
          description:
            type === "Transfer"
              ? "Moving assets to secure cold vault"
              : "Connecting to Identity Registry",
        });
      }, 800);
    });
  },

  async approveTransaction(tx: TransactionSummary): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        useAppStore.getState().addActivity({
          title: `${tx.type} to ${tx.target}`,
          status: "approved",
        });
        resolve(true);
      }, 1200);
    });
  },

  async rejectTransaction(tx: TransactionSummary): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        useAppStore.getState().addActivity({
          title: `Rejected ${tx.type}`,
          status: "denied",
        });
        resolve(false);
      }, 500);
    });
  },
};
