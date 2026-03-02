import { Connection, PublicKey, Logs, ParsedTransactionWithMeta } from '@solana/web3.js';
import { incidentService } from './incidentService';
import { threatEngine } from './threatEngine';

export class WalletWatcher {
  private subscriptionIds: Map<string, number> = new Map();
  private wallets: string[] = [];
  private isRunning: boolean = false;

  constructor(private connection: Connection) {}

  public async start(wallets: string[]): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.wallets = wallets;
    
    console.log(`[WalletWatcher] Starting for ${wallets.length} wallets...`);
    
    for (const wallet of wallets) {
      this.subscribeToWallet(wallet);
    }

    // Monitor for connection health
    this.setupReconnection();
  }

  public stop(): void {
    this.isRunning = false;
    for (const [wallet, subId] of this.subscriptionIds) {
      this.connection.removeOnLogsListener(subId);
      console.log(`[WalletWatcher] Unsubscribed from ${wallet}`);
    }
    this.subscriptionIds.clear();
  }

  private subscribeToWallet(wallet: string): void {
    try {
      const pubkey = new PublicKey(wallet);
      const subId = this.connection.onLogs(
        pubkey,
        (logs) => this.handleLogs(wallet, logs),
        'confirmed'
      );
      this.subscriptionIds.set(wallet, subId);
      console.log(`[WalletWatcher] Subscribed to ${wallet} (SubID: ${subId})`);
    } catch (error) {
      console.error(`[WalletWatcher] Failed to subscribe to ${wallet}:`, error);
    }
  }

  private async handleLogs(wallet: string, logs: Logs): Promise<void> {
    const signature = logs.signature;
    console.log(`[WalletWatcher] New transaction detected for ${wallet}: ${signature}`);

    try {
      const tx = await this.connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed'
      });

      if (tx) {
        this.processTransaction(wallet, tx);
      }
    } catch (error) {
      console.error(`[WalletWatcher] Error fetching transaction ${signature}:`, error);
    }
  }

  private async processTransaction(wallet: string, tx: ParsedTransactionWithMeta): Promise<void> {
    const report = threatEngine.analyzeTransaction(wallet, tx);

    if (report.isThreat) {
      await incidentService.recordIncident({
        wallet,
        txSignature: tx.transaction.signatures[0],
        threatType: report.type,
        severity: report.severity,
        timestamp: Date.now()
      });
    }
  }

  private setupReconnection(): void {
    // Basic reconnection logic on socket error or timeout
    // In production, you might listen to connection.onSignature or use a heartbeat
    setInterval(() => {
      if (!this.isRunning) return;
      
      // Check if subscriptions are still active or if we need to refresh
      // This is a simplified placeholder for production-grade heartbeat monitoring
    }, 30000);
  }
}
