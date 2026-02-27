import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../src/theme';
import { useAppStore } from '../src/store/useAppStore';
import { useIdentityStore } from '../src/store/identityStore';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '../src/components/ui/GlassCard';

export default function WalletSwitchModal() {
  const identity = useIdentityStore();
  
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleWalletSelect = (walletId: string) => {
    Haptics.selectionAsync();
    identity.setActiveWallet(walletId);
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      
      <View style={styles.content}>
        <Text style={styles.headerTitle}>Select Identity</Text>
        
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {identity.wallets.map((wallet) => {
            const isActive = identity.activeWalletId === wallet.id;
            
            return (
              <Pressable 
                key={wallet.id} 
                onPress={() => handleWalletSelect(wallet.id)}
                style={styles.walletItem}
              >
                <GlassCard 
                  intensity={isActive ? 60 : 20}
                  variant={isActive ? 'highlight' : 'default'}
                  style={styles.walletCard}
                >
                  <View style={styles.walletRow}>
                    <View style={[styles.statusDot, isActive && styles.activeDot]} />
                    <View>
                      <Text style={[styles.walletName, isActive && styles.activeText]}>
                        {wallet.name}
                      </Text>
                      <Text style={styles.walletAddress}>
                        {wallet.address.slice(0, 6)}...{wallet.address.slice(-6)}
                      </Text>
                    </View>
                    <View style={styles.balanceContainer}>
                      <Text style={styles.balance}>{wallet.balance.toFixed(2)} SOL</Text>
                    </View>
                  </View>
                </GlassCard>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeText}>DISMISS</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    height: '60%',
    backgroundColor: 'rgba(5, 5, 10, 0.8)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 24,
    alignSelf: 'center',
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  scrollContainer: {
    marginBottom: 20,
  },
  walletItem: {
    marginBottom: 16,
  },
  walletCard: {
    padding: 20,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.text.low,
    marginRight: 16,
  },
  activeDot: {
    backgroundColor: Theme.colors.primary,
    shadowColor: Theme.colors.primary,
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  walletName: {
    color: Theme.colors.text.medium,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activeText: {
    color: '#fff',
  },
  walletAddress: {
    color: Theme.colors.text.low,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  balanceContainer: {
    marginLeft: 'auto',
  },
  balance: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    width: '100%',
    paddingVertical: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
