import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { useIdentityStore } from '../store/identityStore';
import { useAppStore } from '../store/useAppStore';

const SESSION_KEY = 'seeker_session_data';

export interface SessionData {
  userId: string;
  activeWalletId: string;
  wallets: any[];
}

export const sessionManager = {
  async saveSession(data: SessionData) {
    try {
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  },

  async loadSession() {
    try {
      const session = await SecureStore.getItemAsync(SESSION_KEY);
      if (session) {
        const data: SessionData = JSON.parse(session);
        
        // 1. Restore Identity Store
        await useIdentityStore.getState().hydrateSession(data);
        
        // 2. Ensure AppStore knows we are onboarded
        useAppStore.getState().completeOnboarding();
        
        return true;
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
    return false;
  },

  async clearSession() {
    try {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  },

  async authenticateBiometrics(): Promise<boolean> {
    const appStore = useAppStore.getState();
    const identityStore = useIdentityStore.getState();

    try {
      appStore.setBiometricActive(true);
      appStore.setBiometricStatus('scanning');

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      let success = false;
      if (!hasHardware || !isEnrolled) {
        // Simulation for development
        await new Promise(resolve => setTimeout(resolve, 1500));
        success = true;
      } else {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Unlock Seeker Identity Hub',
          fallbackLabel: 'Use Passcode',
          disableDeviceFallback: false,
        });
        success = result.success;
      }

      if (success) {
        appStore.setBiometricStatus('success');
        await new Promise(resolve => setTimeout(resolve, 800));
        identityStore.setLocked(false);
        identityStore.updateInteraction();
        appStore.setBiometricActive(false);
        appStore.setBiometricStatus('idle');
        return true;
      } else {
        appStore.setBiometricStatus('failure');
        await new Promise(resolve => setTimeout(resolve, 1000));
        appStore.setBiometricActive(false);
        appStore.setBiometricStatus('idle');
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      appStore.setBiometricActive(false);
      appStore.setBiometricStatus('idle');
    }
    return false;
  },

  lockApp() {
    useIdentityStore.getState().setLocked(true);
  },

  async logout() {
    await this.clearSession();
    useIdentityStore.getState().logout();
  },

  async login() {
    // This is called after biometric verification
    // For now, it's just a hook for future session management
    return true;
  }
};


