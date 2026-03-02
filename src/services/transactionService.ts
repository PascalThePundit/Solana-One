import { Transaction, RiskLevel, useAppStore } from '../store/useAppStore';
import { rpcManager } from '../solana/connection';

/**
 * Transaction Lifecycle Service (Solana-ready)
 * This service manages the state and simulation of Solana transactions.
 * Enhanced with RPC Failover and Demo Mode support.
 */

export const transactionService = {
  /**
   * Scaffolds simulation of an on-chain transaction
   * In production, this would use simulateTransaction() RPC method.
   */
  async simulateTransaction(type: 'transfer' | 'approval' | 'sign'): Promise<Transaction> {
    const { setPendingTransaction, addActivity, isDemoMode } = useAppStore.getState();
    
    return await rpcManager.executeWithFailover(async (connection) => {
      // 1s RPC simulation delay (simulating network latency)
      await new Promise(r => setTimeout(r, 800));

      const mockTx: Transaction = {
        id: `tx_${Math.random().toString(36).substr(2, 9)}`,
        type: type.toUpperCase(),
        fee: (Math.random() * 0.0005 + 0.000005).toFixed(6) + ' SOL',
        riskLevel: isDemoMode ? 'medium' : (Math.random() > 0.85 ? 'high' : (Math.random() > 0.6 ? 'medium' : 'low')),
        summary: isDemoMode 
          ? `[DEMO] Simulated ${type.toLowerCase()} authorization for Sandbox dApp.`
          : `Requesting ${type.toLowerCase()} authorization for ${Math.random().toString(36).substring(2, 6).toUpperCase()} dApp session.`,
        target: '8xK...3pQ'
      };

      setPendingTransaction(mockTx);
      
      addActivity({
        title: `Simulated ${type} via ${connection.rpcEndpoint.split('/')[2]}`,
        status: 'info'
      });
      
      return mockTx;
    });
  },

  /**
   * Scaffolds MWA signAndSendTransaction flow
   */
  async approveTransaction(): Promise<boolean> {
    const { pendingTransaction, setProcessing, addActivity, setPendingTransaction } = useAppStore.getState();
    if (!pendingTransaction) return false;

    setProcessing(true);
    
    try {
      await rpcManager.executeWithFailover(async (connection) => {
        // 1.5s transaction confirmation (Solana finality)
        await new Promise(r => setTimeout(r, 1200));
        
        // In a real app, we would send the transaction here:
        // await connection.sendRawTransaction(...)
      });

      addActivity({
        title: `${pendingTransaction.type} Approved`,
        status: 'approved'
      });

      return true;
    } catch (err) {
      addActivity({
        title: `Transaction Failed: ${(err as Error).message}`,
        status: 'denied'
      });
      return false;
    } finally {
      setProcessing(false);
      setPendingTransaction(null);
    }
  },

  /**
   * User rejects the transaction
   */
  async rejectTransaction(): Promise<boolean> {
    const { pendingTransaction, addActivity, setPendingTransaction } = useAppStore.getState();
    if (!pendingTransaction) return false;

    addActivity({
      title: `${pendingTransaction.type} Rejected`,
      status: 'denied'
    });

    setPendingTransaction(null);
    return false;
  },

  /**
   * Pre-configured demo scenarios for Hackathon judging
   */
  async triggerDemoScenario(level: RiskLevel) {
    const { setPendingTransaction, setSecurityInsight, addNotification, setDemoMode } = useAppStore.getState();
    
    setDemoMode(true);
    
    // 500ms prep delay
    await new Promise(r => setTimeout(r, 500));

    const mockTx: Transaction = {
      id: `demo_${Date.now()}`,
      type: 'SUSPICIOUS_TRANSFER',
      fee: '0.005 SOL',
      riskLevel: level,
      summary: level === 'high' 
        ? 'High-risk interaction detected with known malicious drainer contract.'
        : 'Unknown dApp session requesting blind signature.',
      target: 'Drain...XYZ'
    };

    setSecurityInsight({
      threatLevel: level,
      insightMessage: level === 'high' 
        ? 'AI CRITICAL: Smart contract fingerprint matches known malicious drainer.'
        : 'AI WARNING: Interaction with new unverified contract.',
      recommendedAction: 'Abort Session'
    });

    addNotification({
      type: 'security',
      title: level === 'high' ? 'CRITICAL THREAT' : 'Security Warning',
      message: 'Suspicious transaction request intercepted.',
      priority: level === 'high' ? 2 : 1
    });

    setPendingTransaction(mockTx);
  }
};
