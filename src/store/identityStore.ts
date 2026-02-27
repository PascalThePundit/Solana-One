import { create } from 'zustand';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { connection } from '../solana/connection';
import { analyzeWalletIntelligence, AnalysisResult } from '../analysis/walletAnalyzer';
import { getStoredHandle } from '../identity/handleRegistry';

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
  
  // Computed (via getters/selectors)
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

  login: async (publicKeyStr?: string) => {
    if (!publicKeyStr) return;
    
    set({ isLoading: true });
    
    // Set up the primary wallet from the connected Solana wallet
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

    // Trigger immediate balance and transaction fetch
    await get().refreshAllData();
    set({ isLoading: false });
    
    // Save session using the updated structure
    import('../security/sessionManager').then(({ sessionManager }) => {
      sessionManager.saveSession({
        userId: `user_${publicKeyStr.substring(0, 8)}`,
        activeWalletId: initialWallets[0].id,
        wallets: initialWallets
      });
    });
  },

  logout: () => {
    set({
      userId: null,
      wallets: [],
      activeWalletId: null,
      isAuthenticated: false,
      isLocked: false,
      recentActivity: [],
      handle: null
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
    set({
      userId: data.userId,
      activeWalletId: data.activeWalletId,
      wallets: data.wallets,
      isAuthenticated: true,
      isLocked: true,
      handle: storedHandle
    });
    get().refreshAllData();
  },

  updateInteraction: () => {
    set({ lastInteraction: Date.now() });
  },

  setHandle: (handle: string | null) => {
    set({ handle });
    // Re-run analysis when handle changes
    const { wallets, recentActivity } = get();
    const intelligence = analyzeWalletIntelligence(wallets, recentActivity, handle);
    set({ intelligence });
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
          console.error(`Failed to fetch balance for ${wallet.address}:`, err);
          return { ...wallet, balance: 0 };
        }
      }));

      // Fetch transactions
      const allActivities: WalletActivity[] = [];
      await Promise.all(wallets.map(async (wallet) => {
        try {
          const pubKey = new PublicKey(wallet.address);
          const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 5 });
          
          signatures.forEach(sig => {
            allActivities.push({
              id: sig.signature,
              walletId: wallet.id,
              title: 'Blockchain Activity',
              status: 'approved',
              timestamp: sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : new Date().toISOString(),
              signature: sig.signature,
              amount: 'View'
            });
          });
        } catch (err) {
          console.error(`Failed to fetch transactions for ${wallet.address}:`, err);
        }
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
      console.error('Refresh failed:', error);
    } finally {
      set({ isLoading: false });
    }
  },

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
