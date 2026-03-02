import { ParsedTransactionWithMeta, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Severity } from './incidentService';

export interface ThreatReport {
  isThreat: boolean;
  type: string;
  severity: Severity;
  score: number;
}

const MALICIOUS_PROGRAMS = new Set([
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', // Known drainer proxy (example)
  '27G8MtS7Z8eGUMpL6DkMueTNDt6S5jXJ9yB1vVp4pY9S', // Suspected malicious
]);

const HIGH_RISK_PROGRAMS = new Set([
  'JUP6LkbZbjS1jKKpphs6818uo5vun7QPrV6N86NDyyS', // Aggregators (high volume/risk)
  '9W959DqEETiYpZPtqFy8zKcCfSmdE6pA4h8CstS3R224', // Orca (standard but high risk for drainers)
]);

export class ThreatEngine {
  private drainThreshold = 5 * LAMPORTS_PER_SOL; // 5 SOL

  public analyzeTransaction(wallet: string, tx: ParsedTransactionWithMeta): ThreatReport {
    // 1. Malicious Program Check
    const maliciousProgram = this.detectMaliciousPrograms(tx);
    if (maliciousProgram) {
      return {
        isThreat: true,
        type: 'MALICIOUS_PROGRAM_INTERACTION',
        severity: 'critical',
        score: 100
      };
    }

    // 2. SOL Drain Detection
    const solChange = this.calculateSolChange(wallet, tx);
    if (solChange < -this.drainThreshold) {
      return {
        isThreat: true,
        type: 'RAPID_SOL_DRAIN',
        severity: 'high',
        score: 80
      };
    }

    // 3. Suspicious Token Approval
    if (this.hasSuspiciousApproval(tx)) {
      return {
        isThreat: true,
        type: 'SUSPICIOUS_TOKEN_APPROVAL',
        severity: 'high',
        score: 75
      };
    }

    // 4. Unknown High Risk Programs
    const highRiskProgram = this.detectHighRiskPrograms(tx);
    if (highRiskProgram) {
      return {
        isThreat: true,
        type: 'HIGH_RISK_PROGRAM_INTERACTION',
        severity: 'medium',
        score: 40
      };
    }

    return { isThreat: false, type: 'NONE', severity: 'low', score: 0 };
  }

  private detectMaliciousPrograms(tx: ParsedTransactionWithMeta): string | null {
    const programIds = tx.transaction.message.instructions.map(ix => ix.programId.toBase58());
    return programIds.find(id => MALICIOUS_PROGRAMS.has(id)) || null;
  }

  private detectHighRiskPrograms(tx: ParsedTransactionWithMeta): string | null {
    const programIds = tx.transaction.message.instructions.map(ix => ix.programId.toBase58());
    return programIds.find(id => HIGH_RISK_PROGRAMS.has(id)) || null;
  }

  private calculateSolChange(wallet: string, tx: ParsedTransactionWithMeta): number {
    const accountIndex = tx.transaction.message.accountKeys.findIndex(ak => ak.pubkey.toBase58() === wallet);
    if (accountIndex === -1 || !tx.meta) return 0;
    return tx.meta.postBalances[accountIndex] - tx.meta.preBalances[accountIndex];
  }

  private hasSuspiciousApproval(tx: ParsedTransactionWithMeta): boolean {
    return tx.transaction.message.instructions.some(ix => {
      if ('parsed' in ix && ix.program === 'spl-token') {
        const type = ix.parsed?.type;
        // Approving a delegate to spend tokens is a common drainer tactic
        return type === 'approve' || type === 'approveChecked';
      }
      return false;
    });
  }
}

export const threatEngine = new ThreatEngine();
