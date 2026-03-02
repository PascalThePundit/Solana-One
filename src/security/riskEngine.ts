import { ParsedTransactionWithMeta, LAMPORTS_PER_SOL } from '@solana/web3.js';

export interface Alert {
  wallet: string;
  signature: string;
  riskLevel: number;
  description: string;
  timestamp: number;
}

export interface RiskConfig {
  largeTransferThreshold: number;
  timeWindowSeconds: number;
  maxTxInWindow: number;
  knownPrograms: string[];
}

const DEFAULT_CONFIG: RiskConfig = {
  largeTransferThreshold: 10 * LAMPORTS_PER_SOL,
  timeWindowSeconds: 60,
  maxTxInWindow: 3,
  knownPrograms: [
    '11111111111111111111111111111111', // System Program
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // Token Program
    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL', // Associated Token Program
    'ComputeBudget111111111111111111111111111111', // Compute Budget
    'MemoSq4gqABboxP7eHqJ4MszN9Pr1NoT34CJvqy1mZN', // Memo Program
  ],
};

export class RiskEngine {
  private txHistory: Map<string, number[]> = new Map();

  constructor(private config: RiskConfig = DEFAULT_CONFIG) {}

  public analyzeTransaction(wallet: string, tx: ParsedTransactionWithMeta): Alert[] {
    const alerts: Alert[] = [];
    const timestamp = (tx.blockTime || 0) * 1000 || Date.now();

    // 1. Failed Transaction
    if (tx.meta?.err) {
      alerts.push(this.createAlert(wallet, tx.transaction.signatures[0], 2, 'Failed transaction detected', timestamp));
    }

    // 2. Large SOL Transfer
    const solChange = this.calculateSolChange(wallet, tx);
    if (Math.abs(solChange) > this.config.largeTransferThreshold) {
      alerts.push(this.createAlert(wallet, tx.transaction.signatures[0], 4, `Large SOL transfer: ${(Math.abs(solChange) / LAMPORTS_PER_SOL).toFixed(2)} SOL`, timestamp));
    }

    // 3. Token Approval
    if (this.hasTokenApproval(tx)) {
      alerts.push(this.createAlert(wallet, tx.transaction.signatures[0], 5, 'High-risk token approval instruction detected', timestamp));
    }

    // 4. Unknown Program Interaction
    const unknownPrograms = this.getUnknownPrograms(tx);
    if (unknownPrograms.length > 0) {
      alerts.push(this.createAlert(wallet, tx.transaction.signatures[0], 3, `Interaction with unknown program(s): ${unknownPrograms.join(', ')}`, timestamp));
    }

    // 5. Velocity Check (Multiple transactions within window)
    if (this.checkVelocity(wallet, timestamp)) {
      alerts.push(this.createAlert(wallet, tx.transaction.signatures[0], 4, 'High transaction frequency (potential bot or drainer)', timestamp));
    }

    return alerts;
  }

  private createAlert(wallet: string, signature: string, riskLevel: number, description: string, timestamp: number): Alert {
    return { wallet, signature, riskLevel, description, timestamp };
  }

  private calculateSolChange(wallet: string, tx: ParsedTransactionWithMeta): number {
    const accountIndex = tx.transaction.message.accountKeys.findIndex(ak => ak.pubkey.toBase58() === wallet);
    if (accountIndex === -1 || !tx.meta) return 0;
    return tx.meta.postBalances[accountIndex] - tx.meta.preBalances[accountIndex];
  }

  private hasTokenApproval(tx: ParsedTransactionWithMeta): boolean {
    return tx.transaction.message.instructions.some(ix => {
      if ('parsed' in ix && ix.program === 'spl-token') {
        const type = ix.parsed?.type;
        return type === 'approve' || type === 'approveChecked';
      }
      return false;
    });
  }

  private getUnknownPrograms(tx: ParsedTransactionWithMeta): string[] {
    const programIds = tx.transaction.message.instructions.map(ix => ix.programId.toBase58());
    return [...new Set(programIds)].filter(pid => !this.config.knownPrograms.includes(pid));
  }

  private checkVelocity(wallet: string, timestamp: number): boolean {
    const history = this.txHistory.get(wallet) || [];
    const windowStart = timestamp - (this.config.timeWindowSeconds * 1000);
    const recentTx = history.filter(t => t > windowStart);
    recentTx.push(timestamp);
    this.txHistory.set(wallet, recentTx);
    return recentTx.length >= this.config.maxTxInWindow;
  }
}
