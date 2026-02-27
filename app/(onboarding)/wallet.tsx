import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Alert } from 'react-native';
import { Theme } from '../../src/theme';
import { useRouter } from 'expo-router';
import { FadeInView } from '../../src/animations/FadeInView';
import { SeekerButton } from '../../src/components/SeekerButton';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useIdentityStore } from '../../src/store/identityStore';
import { generateVerificationMessage, verifyWalletSignature } from '../../src/security/walletVerification';

export default function WalletConnectScreen() {
  const router = useRouter();
  const { setVisible } = useWalletModal();
  const { publicKey, connected, signMessage, disconnect } = useWallet();
  const { login, logout } = useIdentityStore();
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (connected && publicKey && !isVerifying) {
      handleVerification();
    }
  }, [connected, publicKey]);

  const handleVerification = async () => {
    if (!publicKey || !signMessage) return;

    try {
      setIsVerifying(true);
      const message = generateVerificationMessage(publicKey.toBase58());
      const messageBytes = Buffer.from(message, 'utf8');
      const signature = await signMessage(messageBytes);
      
      const isValid = verifyWalletSignature(message, signature, publicKey.toBase58());
      
      if (isValid) {
        await login(publicKey.toBase58());
        router.push('/(onboarding)/biometric');
      } else {
        Alert.alert('Verification Failed', 'Invalid signature. Please try again.');
        await disconnect();
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      if (error.name === 'WalletSignMessageError') {
        Alert.alert('Rejected', 'Signature request was rejected.');
      } else {
        Alert.alert('Error', 'Failed to verify wallet ownership.');
      }
      await disconnect();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConnect = () => {
    setVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <FadeInView delay={400}>
          <Text style={styles.headline}>Connect your Seeker Wallet.</Text>
        </FadeInView>
        <FadeInView delay={800}>
          <Text style={styles.description}>
            Sync your Solana address to unlock your Identity Hub.
          </Text>
        </FadeInView>

        <View style={styles.cardContainer}>
          <FadeInView delay={1200} direction="none">
            <View style={styles.mockCard}>
              {isVerifying || (connected && !publicKey) ? (
                <View style={styles.loadingState}>
                  <ActivityIndicator color={Theme.colors.primary} size="large" />
                  <Text style={styles.loadingText}>Verifying Ownership...</Text>
                </View>
              ) : connected && publicKey ? (
                <View style={styles.readyState}>
                  <View style={[styles.walletIcon, { backgroundColor: '#4ade80' }]} />
                  <Text style={styles.cardTitle}>Wallet Connected</Text>
                  <Text style={styles.cardStatus}>{publicKey.toBase58().substring(0, 8)}...</Text>
                </View>
              ) : (
                <View style={styles.readyState}>
                  <View style={styles.walletIcon} />
                  <Text style={styles.cardTitle}>Solana Wallet</Text>
                  <Text style={styles.cardStatus}>Ready to connect</Text>
                </View>
              )}
            </View>
          </FadeInView>
        </View>
      </View>

      <View style={styles.footer}>
        <FadeInView delay={1600}>
          <SeekerButton 
            title={isVerifying ? "Verifying..." : connected ? "Connected" : "Connect Wallet"} 
            onPress={handleConnect} 
            disabled={isVerifying}
          />
        </FadeInView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Theme.colors.background 
  },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    paddingHorizontal: Theme.spacing.xl 
  },
  headline: {
    color: Theme.colors.text.high,
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 42,
  },
  description: {
    color: Theme.colors.text.medium,
    fontSize: 16,
    lineHeight: 24,
    marginTop: Theme.spacing.md,
    fontWeight: '300',
  },
  cardContainer: {
    marginTop: Theme.spacing.xl,
    height: 200,
  },
  mockCard: {
    backgroundColor: Theme.colors.surface,
    height: '100%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  walletIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Theme.colors.primary,
    marginBottom: Theme.spacing.md,
    opacity: 0.8
  },
  cardTitle: {
    color: Theme.colors.text.high,
    fontSize: 20,
    fontWeight: '600',
  },
  cardStatus: {
    color: Theme.colors.accent,
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  loadingState: {
    alignItems: 'center',
  },
  loadingText: {
    color: Theme.colors.text.medium,
    marginTop: Theme.spacing.md,
    fontSize: 14,
    letterSpacing: 1,
  },
  readyState: {
    alignItems: 'center',
  },
  footer: {
    padding: Theme.spacing.xl,
    paddingBottom: 60,
  }
});
