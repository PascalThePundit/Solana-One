import { 
  Transaction, 
  SystemProgram, 
  PublicKey, 
  Keypair,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { TransactionRiskAnalyzer } from './transactionRiskAnalyzer';
import { Buffer } from 'buffer';

/**
 * MOCK TEST SUITE
 * This demonstrates how to use the TransactionRiskAnalyzer.
 */

async function runTests() {
  console.log('--- Starting Transaction Risk Analysis Tests ---');

  const alice = Keypair.generate();
  const bob = Keypair.generate();

  // 1. Create a Low Risk Transaction (Simple Transfer)
  const lowRiskTx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: alice.publicKey,
      toPubkey: bob.publicKey,
      lamports: 0.1 * LAMPORTS_PER_SOL,
    })
  );
  lowRiskTx.recentBlockhash = '11111111111111111111111111111111'; // Mock blockhash
  lowRiskTx.feePayer = alice.publicKey;

  const serializedLowRisk = lowRiskTx.serialize({ verifySignatures: false }).toString('base64');
  const report1 = await TransactionRiskAnalyzer.analyze(serializedLowRisk, alice.publicKey.toBase58());
  
  console.log('
[TEST 1: Simple Transfer]');
  console.log('Risk Level:', report1.riskLevel);
  console.log('Risk Score:', report1.riskScore);
  console.log('Reasons:', report1.reasons);

  // 2. Create a High Risk Transaction (Mocking a Token Approval)
  // Note: For a real test, we'd use the Token Program instructions properly,
  // but for this mock, we'll manually craft a buffer that matches the pattern.
  const tokenProgramId = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
  const highRiskTx = new Transaction().add({
    keys: [
      { pubkey: alice.publicKey, isSigner: true, isWritable: true },
      { pubkey: bob.publicKey, isSigner: false, isWritable: true },
    ],
    programId: tokenProgramId,
    data: Buffer.from([4, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 255]), // Instruction 4 (Approve)
  });
  highRiskTx.recentBlockhash = '11111111111111111111111111111111';
  highRiskTx.feePayer = alice.publicKey;

  const serializedHighRisk = highRiskTx.serialize({ verifySignatures: false }).toString('base64');
  const report2 = await TransactionRiskAnalyzer.analyze(serializedHighRisk, alice.publicKey.toBase58());

  console.log('
[TEST 2: Token Approval (Drainer Pattern)]');
  console.log('Risk Level:', report2.riskLevel);
  console.log('Risk Score:', report2.riskScore);
  console.log('Reasons:', report2.reasons);

  // 3. Create an Unknown Program Transaction
  const unknownProgramId = Keypair.generate().publicKey;
  const unknownTx = new Transaction().add({
    keys: [{ pubkey: alice.publicKey, isSigner: true, isWritable: true }],
    programId: unknownProgramId,
    data: Buffer.from([1, 2, 3]),
  });
  unknownTx.recentBlockhash = '11111111111111111111111111111111';
  unknownTx.feePayer = alice.publicKey;

  const serializedUnknown = unknownTx.serialize({ verifySignatures: false }).toString('base64');
  const report3 = await TransactionRiskAnalyzer.analyze(serializedUnknown, alice.publicKey.toBase58());

  console.log('
[TEST 3: Unknown Program]');
  console.log('Risk Level:', report3.riskLevel);
  console.log('Risk Score:', report3.riskScore);
  console.log('Reasons:', report3.reasons);
}

// In a real environment, you'd use a test runner like Jest.
// This is for demonstration.
// runTests().catch(console.error);

export const mockTransactions = {
  getLowRisk: () => {
    const tx = new Transaction();
    tx.add(SystemProgram.transfer({
      fromPubkey: PublicKey.default,
      toPubkey: PublicKey.default,
      lamports: 1000,
    }));
    return tx.serialize({ verifySignatures: false }).toString('base64');
  }
};
