import { 
  Transaction, 
  VersionedTransaction, 
  PublicKey, 
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { Buffer } from 'buffer';

// Standard Solana Program IDs
export const KNOWN_PROGRAMS: Record<string, string> = {
  '11111111111111111111111111111111': 'System Program',
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'Token Program',
  'TokenzQdBNZabYkCucT9vG7wpC36FEtA2A6N6rSAd3': 'Token Extensions (Token-2022)',
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL': 'Associated Token Program',
  'ComputeBudget111111111111111111111111111111': 'Compute Budget Program',
  'AddressLookupTab1e1111111111111111111111111': 'Address Lookup Table Program',
  'Stake11111111111111111111111111111111111111': 'Stake Program',
  'Config1111111111111111111111111111111111111': 'Config Program',
  'Vote111111111111111111111111111111111111111': 'Vote Program',
  'BPFLoaderUpgradeab1e11111111111111111111111': 'BPF Upgradeable Loader',
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s': 'Metaplex Token Metadata',
};

// Known Malicious or Suspicious Fingerprints (Mock for now)
const SUSPICIOUS_PROGRAMS = new Set([
  'DRAINer11111111111111111111111111111111111', // Example
]);

export interface RiskReport {
  riskScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
  affectedAssets: string[];
  involvedPrograms: string[];
  isVersioned: boolean;
}

export class TransactionRiskAnalyzer {
  /**
   * Analyzes a serialized Solana transaction for potential risks.
   * @param serializedTx Base64 string or Uint8Array of the transaction
   * @param userPublicKey The public key of the user signing the transaction
   */
  static async analyze(
    serializedTx: string | Uint8Array,
    userPublicKey: string
  ): Promise<RiskReport> {
    let transaction: Transaction | VersionedTransaction;
    let isVersioned = false;

    const binaryTx = typeof serializedTx === 'string' 
      ? Buffer.from(serializedTx, 'base64') 
      : Buffer.from(serializedTx);

    try {
      // Attempt to decode as VersionedTransaction first
      transaction = VersionedTransaction.deserialize(new Uint8Array(binaryTx));
      isVersioned = true;
    } catch (e) {
      // Fallback to legacy Transaction
      try {
        transaction = Transaction.from(new Uint8Array(binaryTx));
        isVersioned = false;
      } catch (err) {
        throw new Error('Failed to decode transaction: Invalid format');
      }
    }

    const report: RiskReport = {
      riskScore: 0,
      riskLevel: 'LOW',
      reasons: [],
      affectedAssets: [],
      involvedPrograms: [],
      isVersioned,
    };

    if (isVersioned) {
      this.analyzeVersioned(transaction as VersionedTransaction, userPublicKey, report);
    } else {
      this.analyzeLegacy(transaction as Transaction, userPublicKey, report);
    }

    // Final risk level determination
    if (report.riskScore >= 70) {
      report.riskLevel = 'HIGH';
    } else if (report.riskScore >= 30) {
      report.riskLevel = 'MEDIUM';
    }

    return report;
  }

  private static analyzeLegacy(tx: Transaction, userPubKey: string, report: RiskReport) {
    const userKey = new PublicKey(userPubKey);
    
    // 1. Extract Programs
    const programIds = new Set<string>();
    tx.instructions.forEach(ix => programIds.add(ix.programId.toBase58()));
    report.involvedPrograms = Array.from(programIds);

    // 2. Check for Unknown/Suspicious Programs
    programIds.forEach(id => {
      if (!KNOWN_PROGRAMS[id]) {
        if (SUSPICIOUS_PROGRAMS.has(id)) {
          report.riskScore += 80;
          report.reasons.push(`Known malicious program detected: ${id}`);
        } else {
          report.riskScore += 15;
          report.reasons.push(`Interaction with unverified program: ${id}`);
        }
      }
    });

    // 3. Analyze Instructions
    tx.instructions.forEach(ix => {
      // System Program Checks
      if (ix.programId.equals(SystemProgram.programId)) {
        this.detectSystemRisk(new Uint8Array(ix.data), report);
      }

      // Token Program Checks
      if (ix.programId.toBase58() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
        this.detectTokenRisk(new Uint8Array(ix.data), report);
      }
    });

    // 4. Check writable accounts (User should be wary if many accounts are writable)
    const writableCount = tx.instructions.reduce((acc, ix) => 
      acc + ix.keys.filter(k => k.isWritable && !k.pubkey.equals(userKey)).length, 0
    );
    
    if (writableCount > 5) {
      report.riskScore += 10;
      report.reasons.push(`High number of writable accounts (${writableCount})`);
    }
  }

  private static analyzeVersioned(tx: VersionedTransaction, userPubKey: string, report: RiskReport) {
    const { message } = tx;
    const accountKeys = message.staticAccountKeys;
    
    // 1. Extract Programs
    const programIds = new Set<string>();
    const instructions = 'compiledInstructions' in message 
      ? message.compiledInstructions 
      : (message as any).instructions; // Handle different versioned message types

    instructions.forEach((ix: any) => {
      const programId = accountKeys[ix.programIdIndex].toBase58();
      programIds.add(programId);
    });
    report.involvedPrograms = Array.from(programIds);

    // 2. Check for Unknown Programs
    programIds.forEach(id => {
      if (!KNOWN_PROGRAMS[id]) {
        report.riskScore += 15;
        report.reasons.push(`Unverified program: ${id}`);
      }
    });

    // 3. Analyze Instructions (Generic check for common patterns)
    instructions.forEach((ix: any) => {
      const programId = accountKeys[ix.programIdIndex];
      if (programId.equals(SystemProgram.programId)) {
        this.detectSystemRisk(new Uint8Array(ix.data), report);
      }
      if (programId.toBase58() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
        this.detectTokenRisk(new Uint8Array(ix.data), report);
      }
    });
  }

  private static detectSystemRisk(data: Uint8Array, report: RiskReport) {
    // Instruction index is the first byte in System Program
    const type = data[0];
    if (type === 2) { // Transfer
      report.riskScore += 20;
      report.reasons.push('Direct SOL transfer detected');
      report.affectedAssets.push('SOL');
    }
    if (type === 8) { // Allocate
      report.riskScore += 10;
      report.reasons.push('Account allocation detected');
    }
  }

  private static detectTokenRisk(data: Uint8Array, report: RiskReport) {
    const type = data[0];
    // Token Program Instruction Indices:
    // 4: Approve
    // 6: SetAuthority
    // 12: Burn
    if (type === 4) {
      report.riskScore += 50;
      report.reasons.push('Token approval (potential drainer pattern)');
      report.affectedAssets.push('SPL Token');
    }
    if (type === 6) {
      report.riskScore += 60;
      report.reasons.push('Authority change detected (HIGH RISK)');
    }
    if (type === 12) {
      report.riskScore += 30;
      report.reasons.push('Token burn instruction detected');
    }
  }
}
