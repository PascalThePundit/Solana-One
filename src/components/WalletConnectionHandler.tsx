import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useIdentityStore } from '../store/identityStore';
import { useAppStore } from '../store/useAppStore';
import { useRouter } from 'expo-router';

export const WalletConnectionHandler = () => {
  const { connected, publicKey, connecting } = useWallet();
  const { isAuthenticated, logout } = useIdentityStore();
  const isOnboarded = useAppStore(state => state.isOnboarded);
  const router = useRouter();

  useEffect(() => {
    // If we were authenticated but now the wallet is disconnected and not trying to connect
    if (isAuthenticated && !connected && !connecting) {
      logout();
      if (isOnboarded) {
        router.replace('/(onboarding)/intro');
      }
    }
  }, [connected, isAuthenticated, isOnboarded, connecting]);

  return null;
};
