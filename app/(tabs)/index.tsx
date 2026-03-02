import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, RefreshControl, Dimensions, Alert, Pressable } from 'react-native';
import { router } from 'expo-router';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withDelay, 
  withTiming, 
  withRepeat,
  interpolate,
  Extrapolate,
  Easing
} from 'react-native-reanimated';
import { Theme } from '../../src/theme';
import { Motion } from '../../src/theme/motion';
import { IdentityCard } from '../../src/components/dashboard/IdentityCard';
import { SecurityInsightCard } from '../../src/components/dashboard/SecurityInsightCard';
import { IdentityInsightCard } from '../../src/components/dashboard/IdentityInsightCard';
import { IdentityBadge } from '../../src/components/IdentityBadge';
import { HandleClaimModal } from '../../src/components/HandleClaimModal';
import { SeekerButton } from '../../src/components/SeekerButton';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useIdentityStore } from '../../src/store/identityStore';
import { useAppStore } from '../../src/store/useAppStore';
import { transactionService } from '../../src/services/transactionService';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

// Polished Intelligence Item preserved from existing logic
const IntelligenceItem = React.memo(({ activity }: { activity: any }) => (
  <View style={styles.activityItem}>
    <View style={styles.activityInfo}>
      <Text style={styles.activityTitle}>{activity.title}</Text>
      <View style={styles.activityMeta}>
        <Text style={styles.activityTime}>
          {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        {activity.amount && (
          <Text style={styles.activityAmount}>{activity.amount}</Text>
        )}
      </View>
    </View>
    <View style={[
      styles.badge, 
      activity.status === 'denied' && styles.deniedBadge,
      activity.status === 'info' && styles.infoBadge
    ]}>
      <Text style={[
        styles.badgeText,
        activity.status === 'denied' && { color: '#EF4444' },
        activity.status === 'info' && { color: Theme.colors.primary }
      ]}>
        {activity.status.toUpperCase()}
      </Text>
    </View>
  </View>
));
IntelligenceItem.displayName = 'IntelligenceItem';

const FadeInItem = React.memo(({ delay, children }: { delay: number; children: React.ReactNode }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: Motion.duration.medium, easing: Motion.easing.decelerate }));
    translateY.value = withDelay(delay, withTiming(0, { duration: Motion.duration.medium, easing: Motion.easing.decelerate }));
  }, [delay]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
});
FadeInItem.displayName = 'FadeInItem';

export default function DashboardScreen() {
  const { setVisible } = useWalletModal();
  const { connected: walletConnected, publicKey, connecting: walletConnecting } = useWallet();
  const notificationsCount = useAppStore(state => state.notificationsCount);

  // Identity Store integration
  const identity = useIdentityStore();
  const aggregatedBalance = identity.getAggregatedBalance();
  const activeWallet = identity.getActiveWallet();
  const combinedActivity = identity.getCombinedActivity();

  const [refreshing, setRefreshing] = React.useState(false);
  const [isClaimModalVisible, setClaimModalVisible] = useState(false);
  
  // Parallax Background Values
  const scrollY = useSharedValue(0);
  const blobX = useSharedValue(0);
  const blobRotate = useSharedValue(0);

  useEffect(() => {
    // Background animation loops
    blobX.value = withRepeat(
      withTiming(width * 0.25, { 
        duration: 10000, 
        easing: Easing.inOut(Easing.sin) 
      }),
      -1,
      true
    );
    blobRotate.value = withRepeat(
      withTiming(360, { 
        duration: 25000, 
        easing: Easing.linear 
      }),
      -1,
      false
    );
    
    // Initial data fetch preserved
    if (walletConnected && publicKey) {
      identity.refreshAllData();
    }
  }, [walletConnected, publicKey]);

  // Existing handlers preserved
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await identity.refreshAllData();
    setRefreshing(false);
  }, [identity]);

  const handleConnect = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setVisible(true);
  }, [setVisible]);

  const triggerMockTransaction = useCallback((type: 'transfer' | 'approval' | 'sign') => {
    if (!walletConnected) {
      Alert.alert('Seeker Required', 'Please connect your Seeker wallet first.');
      return;
    }
    router.push({
      pathname: '/approve-transaction',
      params: { type }
    });
  }, [walletConnected]);

  const triggerDemo = useCallback((level: 'low' | 'medium' | 'high') => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    transactionService.triggerDemoScenario(level);
    router.push({
      pathname: '/approve-transaction',
      params: { type: 'DEMO' }
    });
  }, []);

  const getGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // Enhanced Parallax Styles
  const blobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: blobX.value },
      { translateY: interpolate(scrollY.value, [0, 500], [0, 150], Extrapolate.CLAMP) },
      { rotate: `${blobRotate.value}deg` }
    ],
  }));

  const handleScroll = (event: any) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient Infrastructure */}
      <LinearGradient
        colors={['#050505', '#0f0f0f', '#000']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Decorative Parallax Blobs */}
      <Animated.View style={[styles.bgBlob, blobStyle]}>
        <LinearGradient
          colors={[`${Theme.colors.primary}15`, 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.ScrollView 
        contentContainerStyle={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={Theme.colors.primary} 
            progressViewOffset={60}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <FadeInItem delay={Motion.delay.base}>
          <View style={styles.header}>
            <View>
              <Text style={styles.appName}>Seeker Identity Hub</Text>
              <Text style={styles.greeting}>{getGreeting}, Seeker</Text>
              {identity.handle && (
                <Text style={styles.handleText}>{identity.handle}</Text>
              )}
              <Text style={styles.subGreeting}>
                {aggregatedBalance.toFixed(2)} SOL (Aggregated)
              </Text>
            </View>
            
            <Pressable 
              style={styles.profileBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/modal');
              }}
            >
              {identity.handle ? (
                <IdentityBadge handle={identity.handle} size={48} />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                  {notificationsCount > 0 && <View style={styles.notificationDot} />}
                </View>
              )}
            </Pressable>
          </View>
        </FadeInItem>

        <FadeInItem delay={Motion.delay.base + Motion.delay.step}>
          <IdentityCard />
        </FadeInItem>

        {walletConnected && (
          <FadeInItem delay={Motion.delay.base + Motion.delay.step * 1.5}>
            <SecurityInsightCard />
          </FadeInItem>
        )}

        <View style={styles.section}>
          <FadeInItem delay={Motion.delay.base + Motion.delay.step * 1.8}>
            <Text style={styles.sectionTitle}>Identity Wallets</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletScroll}>
              {identity.wallets.map((w) => (
                <Pressable 
                  key={w.id} 
                  style={[
                    styles.walletTab, 
                    identity.activeWalletId === w.id && styles.walletTabActive
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    identity.setActiveWallet(w.id);
                  }}
                >
                  <View style={styles.walletTabHeader}>
                    <Text style={[
                      styles.walletTabText,
                      identity.activeWalletId === w.id && styles.walletTabTextActive
                    ]}>{w.name}</Text>
                    {identity.activeWalletId === w.id && identity.handle && (
                      <IdentityBadge handle={identity.handle} size={16} style={styles.miniBadge} />
                    )}
                  </View>
                  <Text style={styles.walletTabBalance}>{w.balance.toFixed(2)} SOL</Text>
                </Pressable>
              ))}
            </ScrollView>
          </FadeInItem>
        </View>

        <View style={styles.section}>
          <FadeInItem delay={Motion.delay.base + Motion.delay.step * 2}>
            <Text style={styles.sectionTitle}>Command Console</Text>
            {!walletConnected ? (
              <SeekerButton 
                title={walletConnecting ? "Connecting..." : "Connect Seeker Wallet"} 
                onPress={handleConnect} 
                style={styles.connectBtn}
              />
            ) : (
              <View style={styles.actionRow}>
                <SeekerButton 
                  title="Transfer" 
                  onPress={() => triggerMockTransaction('transfer')} 
                  style={styles.actionBtn} 
                  variant="secondary" 
                />
                <SeekerButton 
                  title="Identity" 
                  onPress={() => triggerMockTransaction('sign')} 
                  style={styles.actionBtn} 
                  variant="secondary" 
                />
              </View>
            )}
          </FadeInItem>
        </View>

        {/* Hackathon Demo Controls preserved */}
        <View style={styles.section}>
          <FadeInItem delay={Motion.delay.base + Motion.delay.step * 2.5}>
            <Text style={styles.sectionTitle}>Demo Scenarios</Text>
            <View style={styles.demoRow}>
              <Pressable style={styles.demoBtn} onPress={() => triggerDemo('medium')}>
                <BlurView intensity={10} tint="light" style={StyleSheet.absoluteFill} />
                <Text style={styles.demoBtnText}>Suspicious dApp</Text>
              </Pressable>
              <Pressable style={[styles.demoBtn, styles.demoBtnHigh]} onPress={() => triggerDemo('high')}>
                <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
                <Text style={[styles.demoBtnText, { color: '#EF4444' }]}>Critical Drainer</Text>
              </Pressable>
            </View>
          </FadeInItem>
        </View>

        <View style={styles.section}>
          <FadeInItem delay={Motion.delay.base + Motion.delay.step * 2.8}>
            <IdentityInsightCard />
          </FadeInItem>

          {!identity.handle && walletConnected && (
            <FadeInItem delay={Motion.delay.base + Motion.delay.step * 2.9}>
              <Pressable style={styles.claimCard} onPress={() => setClaimModalVisible(true)}>
                <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                <LinearGradient
                  colors={[`${Theme.colors.primary}30`, 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.claimContent}>
                  <View>
                    <Text style={styles.claimTitle}>Claim Identity Handle</Text>
                    <Text style={styles.claimSubtitle}>Secure your .sol namespace</Text>
                  </View>
                  <View style={styles.claimBadge}>
                    <Text style={styles.claimBadgeText}>.SOL</Text>
                  </View>
                </View>
              </Pressable>
            </FadeInItem>
          )}
          
          <FadeInItem delay={Motion.delay.base + Motion.delay.step * 3}>
            <Text style={styles.sectionTitle}>Intelligence Stream</Text>
            {combinedActivity.length > 0 ? (
              combinedActivity.map((activity) => (
                <IntelligenceItem key={activity.id} activity={activity} />
              ))
            ) : (
              <Text style={styles.emptyText}>No recent security events</Text>
            )}
          </FadeInItem>
        </View>
      </Animated.ScrollView>

      <HandleClaimModal 
        visible={isClaimModalVisible} 
        onClose={() => setClaimModalVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  bgBlob: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    top: -width * 0.4,
    right: -width * 0.4,
    opacity: 0.6,
  },
  content: { 
    padding: Theme.spacing.lg, 
    paddingTop: 80,
    paddingBottom: 120
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 44 
  },
  appName: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
    opacity: 0.6,
  },
  greeting: { 
    color: '#fff', 
    fontSize: 32, 
    fontWeight: '700',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(255,255,255,0.15)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  handleText: {
    color: Theme.colors.primary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  subGreeting: { 
    color: 'rgba(255,255,255,0.5)', 
    fontSize: 14, 
    marginTop: 8,
    fontWeight: '500',
  },
  profileBtn: {
    width: 52,
    height: 52,
  },
  profilePlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden'
  },
  notificationDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Theme.colors.primary,
    borderWidth: 2.5,
    borderColor: '#000'
  },
  section: { 
    marginTop: 48 
  },
  sectionTitle: { 
    color: 'rgba(255,255,255,0.4)', 
    fontSize: 11, 
    letterSpacing: 2, 
    fontWeight: '800', 
    marginBottom: 24, 
    textTransform: 'uppercase',
  },
  actionRow: { 
    flexDirection: 'row', 
    gap: 14 
  },
  actionBtn: { 
    flex: 1, 
    paddingVertical: 16,
    borderRadius: 20
  },
  connectBtn: {
    paddingVertical: 20,
    borderRadius: 22
  },
  demoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  demoBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    overflow: 'hidden'
  },
  demoBtnHigh: {
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  demoBtnText: {
    color: Theme.colors.text.medium,
    fontSize: 12,
    fontWeight: '700',
    zIndex: 1
  },
  walletScroll: {
    flexDirection: 'row',
    marginBottom: 10
  },
  walletTabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8
  },
  miniBadge: {
    borderWidth: 1,
  },
  walletTab: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    minWidth: 120
  },
  walletTabActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: Theme.colors.primary,
  },
  walletTabText: {
    color: Theme.colors.text.medium,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  walletTabTextActive: {
    color: Theme.colors.primary,
  },
  walletTabBalance: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '400',
    marginTop: 4
  },
  claimCard: {
    marginTop: 16,
    padding: 20,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  claimContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  claimTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  claimSubtitle: {
    color: Theme.colors.text.medium,
    fontSize: 13,
    marginTop: 2,
    opacity: 0.7
  },
  claimBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  claimBadgeText: {
    color: Theme.colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  activityItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  activityInfo: {
    flex: 1
  },
  activityTitle: { 
    color: Theme.colors.text.high, 
    fontSize: 16, 
    fontWeight: '400',
    marginBottom: 6
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  activityTime: { 
    color: Theme.colors.text.low, 
    fontSize: 12,
    opacity: 0.6
  },
  activityAmount: {
    color: Theme.colors.text.medium,
    fontSize: 11,
    fontWeight: '600'
  },
  badge: { 
    backgroundColor: 'rgba(16, 185, 129, 0.1)', 
    paddingHorizontal: 12, 
    paddingVertical: 7, 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)'
  },
  deniedBadge: { 
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)'
  },
  infoBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderColor: 'rgba(124, 58, 237, 0.3)'
  },
  badgeText: { 
    color: Theme.colors.accent, 
    fontSize: 10, 
    fontWeight: '900',
    letterSpacing: 0.8
  },
  emptyText: {
    color: Theme.colors.text.low,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 24,
    opacity: 0.5
  }
});
