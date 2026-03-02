import { create } from 'zustand';

export type VerificationLevel = 'basic' | 'verified' | 'institutional';
export type RiskLevel = 'low' | 'medium' | 'high';
export type NotificationType = 'security' | 'transaction' | 'info';

export interface IdentityData {
  verificationLevel: VerificationLevel;
  riskScore: number;
  permissions: string[];
  lastActivity: string;
  activeSessions: number;
}

export interface Transaction {
  id: string;
  type: string;
  fee: string;
  riskLevel: RiskLevel;
  summary: string;
  target?: string;
}

export interface SecurityInsight {
  threatLevel: RiskLevel;
  insightMessage: string;
  recommendedAction: string;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: number; // 0 low, 1 medium, 2 high
  timestamp: string;
  isRead: boolean;
}

export interface AppActivity {
  id: string;
  title: string;
  status: 'approved' | 'denied' | 'info';
  timestamp: string;
}

interface AppState {
  // Persistence
  isOnboarded: boolean;
  
  // Wallet & Identity
  walletConnected: boolean;
  walletPublicKey: string | null;
  identityData: IdentityData | null;
  
  // Security Intelligence
  securityInsight: SecurityInsight | null;
  isBiometricActive: boolean;
  biometricStatus: 'idle' | 'scanning' | 'success' | 'failure';
  
  // Transaction Flow
  pendingTransaction: Transaction | null;
  isProcessingTransaction: boolean;
  
  // Notifications
  notifications: AppNotification[];
  notificationsCount: number;

  // Activity
  activityHistory: AppActivity[];

  // Demo Mode
  isDemoMode: boolean;

  // Actions
  completeOnboarding: () => void;
  setWalletState: (connected: boolean, publicKey: string | null) => void;
  setWalletConnected: (connected: boolean) => void;
  setIdentityData: (data: IdentityData | null) => void;
  setSecurityInsight: (insight: SecurityInsight | null) => void;
  setBiometricStatus: (status: 'idle' | 'scanning' | 'success' | 'failure') => void;
  setBiometricActive: (active: boolean) => void;
  setPendingTransaction: (tx: Transaction | null) => void;
  setProcessing: (processing: boolean) => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  addActivity: (activity: Omit<AppActivity, 'id' | 'timestamp'>) => void;
  setDemoMode: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOnboarded: false,
  walletConnected: false,
  walletPublicKey: null,
  identityData: null,
  securityInsight: {
    threatLevel: 'low',
    insightMessage: 'System integrity verified. No anomalies detected.',
    recommendedAction: 'View Report'
  },
  isBiometricActive: false,
  biometricStatus: 'idle',
  pendingTransaction: null,
  isProcessingTransaction: false,
  notifications: [],
  notificationsCount: 0,
  activityHistory: [],
  isDemoMode: false,

  completeOnboarding: () => set((state) => ({ ...state, isOnboarded: true })),
  
  setWalletState: (connected, publicKey) => set((state) => ({ 
    ...state,
    walletConnected: connected, 
    walletPublicKey: publicKey 
  })),

  setWalletConnected: (connected) => set((state) => ({
    ...state,
    walletConnected: connected
  })),

  setIdentityData: (data) => set((state) => ({ ...state, identityData: data })),
  
  setSecurityInsight: (insight) => set((state) => ({ ...state, securityInsight: insight })),
  
  setBiometricStatus: (status) => set((state) => ({ ...state, biometricStatus: status })),
  
  setBiometricActive: (active) => set((state) => ({ ...state, isBiometricActive: active })),

  setPendingTransaction: (tx) => set((state) => ({ ...state, pendingTransaction: tx })),
  
  setProcessing: (processing) => set((state) => ({ ...state, isProcessingTransaction: processing })),

  addNotification: (n) => set((state) => {
    const newNotification: AppNotification = {
      ...n,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      isRead: false
    };
    const updated = [newNotification, ...state.notifications];
    return {
      ...state,
      notifications: updated,
      notificationsCount: updated.filter(x => !x.isRead).length
    };
  }),

  markNotificationRead: (id) => set((state) => {
    const updated = state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    return {
      ...state,
      notifications: updated,
      notificationsCount: updated.filter(x => !x.isRead).length
    };
  }),

  clearNotifications: () => set((state) => ({ ...state, notifications: [], notificationsCount: 0 })),

  addActivity: (a) => set((state) => ({
    ...state,
    activityHistory: [
      {
        ...a,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString()
      },
      ...state.activityHistory.slice(0, 9) // Keep last 10
    ]
  })),

  setDemoMode: (enabled) => set((state) => ({ ...state, isDemoMode: enabled })),
}));
