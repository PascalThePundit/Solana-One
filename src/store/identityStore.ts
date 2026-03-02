import { create } from 'zustand';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { connection } from '../solana/connection';
import { analyzeWalletIntelligence, AnalysisResult } from '../analysis/walletAnalyzer';
import { getStoredHandle } from '../identity/handleRegistry';
import { WalletMonitor } from '../services/walletMonitor';
import { Alert } from '../security/riskEngine';

export interface Wallet {
  id: string;
  name: string;
  address: string;
  balance: number;
  lastActive: string;
}

export interface WalletActivity {
  id: string;
  walletId: string;
  title: string;
  status: 'approved' | 'denied' | 'info';
  timestamp: string;
  amount?: string;
  signature?: string;
}

interface IdentityState {
  userId: string | null;
  wallets: Wallet[];
  activeWalletId: string | null;
  isAuthenticated: boolean;
  isLocked: boolean;
  lastInteraction: number;
  recentActivity: WalletActivity[];
  isLoading: boolean;
  intelligence: AnalysisResult | null;
  handle: string | null;
  alerts: Alert[];
  monitor: WalletMonitor | null;
  
  // Actions
  login: (publicKeyStr?: string) => Promise<void>;
  logout: () => void;
  setActiveWallet: (id: string) => void;
  setLocked: (isLocked: boolean) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  hydrateSession: (data: { userId: string; activeWalletId: string; wallets: Wallet[] }) => void;
  updateInteraction: () => void;
  refreshAllData: () => Promise<void>;
  setHandle: (handle: string | null) => void;
  addAlert: (alert: Alert) => void;
  
  // UI Integration
  getAlerts: () => Alert[];
  getRiskLevel: () => number;
  getRecentActivity: () => WalletActivity[];
  getAggregatedBalance: () => number;
  getActiveWallet: () => Wallet | null;
  getCombinedActivity: () => WalletActivity[];
}

export const useIdentityStore = create<IdentityState>((set, get) => ({
  userId: null,
  wallets: [],
  activeWalletId: null,
  isAuthenticated: false,
  isLocked: false,
  lastInteraction: Date.now(),
  recentActivity: [],
  isLoading: false,
  intelligence: null,
  handle: null,
  alerts: [],
  monitor: null,

  login: async (publicKeyStr?: string) => {
    if (!publicKeyStr) return;
    
    set({ isLoading: true });
    
    const initialWallets: Wallet[] = [
      {
        id: 'primary',
        name: 'Main Wallet',
        address: publicKeyStr,
        balance: 0,
        lastActive: new Date().toISOString(),
      }
    ];

    const storedHandle = await getStoredHandle();

    set({
      userId: `user_${publicKeyStr.substring(0, 8)}`,
      wallets: initialWallets,
      activeWalletId: initialWallets[0].id,
      isAuthenticated: true,
      isLocked: false,
      lastInteraction: Date.now(),
      handle: storedHandle
    });

    // Initialize Monitor
    const monitor = new WalletMonitor(connection);
    monitor.setWallets(initialWallets.map(w => w.address));
    monitor.onAlert((alert) => get().addAlert(alert));
    monitor.start();
    set({ monitor });

    await get().refreshAllData();
    set({ isLoading: false });
    
    import('../security/sessionManager').then(({ sessionManager }) => {
      sessionManager.saveSession({
        userId: `user_${publicKeyStr.substring(0, 8)}`,
        activeWalletId: initialWallets[0].id,
        wallets: initialWallets
      });
    });
  },

  logout: () => {
    const { monitor } = get();
    if (monitor) monitor.stop();

    set({
      userId: null,
      wallets: [],
      activeWalletId: null,
      isAuthenticated: false,
      isLocked: false,
      recentActivity: [],
      handle: null,
      alerts: [],
      monitor: null
    });
    
    import('../security/sessionManager').then(({ sessionManager }) => {
      sessionManager.clearSession();
    });
  },

  setActiveWallet: (id: string) => {
    set({ activeWalletId: id });
    const { userId, wallets } = get();
    if (userId) {
      import('../security/sessionManager').then(({ sessionManager }) => {
        sessionManager.saveSession({
          userId,
          activeWalletId: id,
          wallets
        });
      });
    }
  },

  setLocked: (isLocked: boolean) => {
    set({ isLocked });
  },

  setAuthenticated: (isAuthenticated: boolean) => {
    set({ isAuthenticated });
  },

  hydrateSession: async (data) => {
    const storedHandle = await getStoredHandle();
    
    const monitor = new WalletMonitor(connection);
    monitor.setWallets(data.wallets.map(w => w.address));
    monitor.onAlert((alert) => get().addAlert(alert));
    monitor.start();

    set({
      userId: data.userId,
      activeWalletId: data.activeWalletId,
      wallets: data.wallets,
      isAuthenticated: true,
      isLocked: true,
      handle: storedHandle,
      monitor
    });
    get().refreshAllData();
  },

  updateInteraction: () => {
    set({ lastInteraction: Date.now() });
  },

  setHandle: (handle: string | null) => {
    set({ handle });
    const { wallets, recentActivity } = get();
    const intelligence = analyzeWalletIntelligence(wallets, recentActivity, handle);
    set({ intelligence });
  },

  addAlert: (alert: Alert) => {
    const { alerts, intelligence } = get();
    const updatedAlerts = [alert, ...alerts].slice(0, 50); // Keep last 50
    
    // Impact Intelligence
    if (intelligence) {
      const riskImpact = alert.riskLevel * 2;
      const newScore = Math.max(0, intelligence.identityScore - riskImpact);
      const newRiskLevel = alert.riskLevel >= 4 ? 'High' : (alert.riskLevel >= 2 ? 'Moderate' : intelligence.riskLevel);
      
      set({
        alerts: updatedAlerts,
        intelligence: {
          ...intelligence,
          identityScore: newScore,
          riskLevel: newRiskLevel as 'Low' | 'Moderate' | 'High'
        }
      });
    } else {
      set({ alerts: updatedAlerts });
    }
  },

  refreshAllData: async () => {
    const { wallets, handle } = get();
    if (wallets.length === 0) return;

    set({ isLoading: true });

    try {
      const updatedWallets = await Promise.all(wallets.map(async (wallet) => {
        try {
          const pubKey = new PublicKey(wallet.address);
          const balance = await connection.getBalance(pubKey);
          return {
            ...wallet,
            balance: balance / LAMPORTS_PER_SOL,
            lastActive: new Date().toISOString()
          };
        } catch (err) {
          return { ...wallet, balance: 0 };
        }
      }));

      const allActivities: WalletActivity[] = [];
      await Promise.all(wallets.map(async (wallet) => {
        try {
          const pubKey = new PublicKey(wallet.address);
          const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 10 });
          
          signatures.forEach(sig => {
            allActivities.push({
              id: sig.signature,
              walletId: wallet.id,
              title: 'Blockchain Activity',
              status: sig.err ? 'denied' : 'approved',
              timestamp: sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : new Date().toISOString(),
              signature: sig.signature,
              amount: 'View'
            });
          });
        } catch (err) {}
      }));

      const sortedActivity = allActivities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      const intelligence = analyzeWalletIntelligence(updatedWallets, sortedActivity, handle);

      set({ 
        wallets: updatedWallets,
        recentActivity: sortedActivity,
        intelligence
      });
    } catch (error) {
    } finally {
      set({ isLoading: false });
    }
  },

  getAlerts: () => get().alerts,
  
  getRiskLevel: () => {
    const { alerts } = get();
    if (alerts.length === 0) return 1;
    return Math.max(...alerts.map(a => a.riskLevel));
  },

  getRecentActivity: () => get().recentActivity,

  getAggregatedBalance: () => {
    return get().wallets.reduce((acc, w) => acc + w.balance, 0);
  },

  getActiveWallet: () => {
    const { wallets, activeWalletId } = get();
    return wallets.find(w => w.id === activeWalletId) || null;
  },

  getCombinedActivity: () => {
    return get().recentActivity;
  }
}));

