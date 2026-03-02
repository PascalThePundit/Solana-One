import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

// Minimal IDL for parsing the accounts
const PROGRAM_ID = new PublicKey('11111111111111111111111111111111');

export interface IdentityData {
  wallet: string;
  identity_score: number;
  risk_level: string;
  linked_wallet_count: number;
  last_updated: number;
}

const RISK_LEVEL_MAP: Record<number, string> = {
  0: 'Low',
  1: 'Low',
  2: 'Moderate',
  3: 'Moderate',
  4: 'High',
  5: 'Critical',
};

export class SolanaService {
  private connection: Connection;

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  public async getIdentity(walletAddress: string): Promise<IdentityData | null> {
    try {
      const wallet = new PublicKey(walletAddress);

      // Derive PDAs
      const [identityPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('identity'), wallet.toBuffer()],
        PROGRAM_ID
      );
      const [scorePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('score'), wallet.toBuffer()],
        PROGRAM_ID
      );

      // Fetch accounts
      const [identityAccount, scoreAccount] = await Promise.all([
        this.connection.getAccountInfo(identityPda),
        this.connection.getAccountInfo(scorePda),
      ]);

      if (!identityAccount || !scoreAccount) {
        return null;
      }

      // Parse Score Account (Offset based on Anchor's discriminator and layout)
      // IdentityScoreAccount Layout: 
      // 8 (disc) + 32 (auth) + 8 (score) + 1 (risk) + 8 (tx_count) + 8 (last_updated)
      const data = scoreAccount.data;
      const identity_score = Number(data.readBigUInt64LE(8 + 32));
      const risk_level_num = data.readUInt8(8 + 32 + 8);
      const tx_count = Number(data.readBigUInt64LE(8 + 32 + 8 + 1));
      const last_updated = Number(data.readBigInt64LE(8 + 32 + 8 + 1 + 8));

      return {
        wallet: walletAddress,
        identity_score,
        risk_level: RISK_LEVEL_MAP[risk_level_num] || 'Unknown',
        linked_wallet_count: tx_count, // Using tx_count as a proxy for engagement in this stage
        last_updated,
      };
    } catch (error) {
      console.error('SolanaService Error:', error);
      return null;
    }
  }
}
