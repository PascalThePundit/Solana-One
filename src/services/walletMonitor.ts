import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import { RiskEngine, Alert } from '../security/riskEngine';

export type AlertCallback = (alert: Alert) => void;

export class WalletMonitor {
  private wallets: string[] = [];
  private lastSignatures: Map<string, string> = new Map();
  private riskEngine: RiskEngine;
  private isRunning: boolean = false;
  private pollInterval: number = 10000; // 10 seconds
  private onAlertCallbacks: AlertCallback[] = [];

  constructor(private connection: Connection) {
    this.riskEngine = new RiskEngine();
  }

  public setWallets(wallets: string[]) {
    this.wallets = wallets;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.poll();
  }

  public stop() {
    this.isRunning = false;
  }

  public onAlert(callback: AlertCallback) {
    this.onAlertCallbacks.push(callback);
  }

  private async poll() {
    if (!this.isRunning) return;

    try {
      await Promise.all(this.wallets.map(wallet => this.monitorWallet(wallet)));
    } catch (error) {
      console.error('WalletMonitor poll error:', error);
    }

    setTimeout(() => this.poll(), this.pollInterval);
  }

  private async monitorWallet(wallet: string) {
    const pubkey = new PublicKey(wallet);
    const lastSignature = this.lastSignatures.get(wallet);

    try {
      const signatures = await this.connection.getSignaturesForAddress(pubkey, {
        until: lastSignature,
        limit: 10,
      });

      if (signatures.length === 0) return;

      // Update last signature to the latest one
      this.lastSignatures.set(wallet, signatures[0].signature);

      // Process from oldest to newest
      for (let i = signatures.length - 1; i >= 0; i--) {
        const sigInfo = signatures[i];
        const tx = await this.connection.getParsedTransaction(sigInfo.signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (tx) {
          this.processTransaction(wallet, tx);
        }
      }
    } catch (error) {
      console.error(`Error monitoring wallet ${wallet}:`, error);
    }
  }

  private processTransaction(wallet: string, tx: ParsedTransactionWithMeta) {
    const alerts = this.riskEngine.analyzeTransaction(wallet, tx);
    alerts.forEach(alert => {
      this.onAlertCallbacks.forEach(cb => cb(alert));
    });
  }
}
