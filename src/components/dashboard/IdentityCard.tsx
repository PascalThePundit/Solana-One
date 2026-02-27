import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  interpolateColor,
  interpolate,
  withDelay,
  withSequence,
  Easing
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Theme } from '../../theme';
import { Motion } from '../../theme/motion';
import { useAppStore } from '../../store/useAppStore';
import { useIdentityStore } from '../../store/identityStore';
import { GlassCard } from '../ui/GlassCard';

const BREATHING_DURATION = 4000;
const SHIMMER_DURATION = 2500;

export const IdentityCard = React.memo(() => {
  // Existing state hooks
  const walletConnected = useAppStore((state) => state.walletConnected);
  const appPublicKey = useAppStore((state) => state.walletPublicKey);
  const identityData = useAppStore((state) => state.identityData);
  
  // Identity Store integration
  const identity = useIdentityStore();
  const activeWallet = identity.getActiveWallet();
  
  // Use identity wallet address if available, otherwise fallback to app store
  const displayAddress = activeWallet ? activeWallet.address : appPublicKey;
  const displayName = activeWallet ? activeWallet.name : 'Solana Mainnet-Beta';
  
  // Existing derived logic
  const identityStatus = identityData?.verificationLevel || 'basic';
  
  // Animation Values
  const glow = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Breathing glow loop
    glow.value = withRepeat(
      withTiming(1, { duration: BREATHING_DURATION, easing: Motion.easing.natural }),
      -1,
      true
    );
  }, []);

  // Existing helper function preserved & enhanced
  const getStatusColor = () => {
    if (!walletConnected) return Theme.colors.text.low;
    switch (identityStatus) {
      case 'institutional': return Theme.colors.accent; // Cyan/Blue
      case 'verified': return Theme.colors.primary; // Purple/Primary
      default: return '#F59E0B'; // Amber
    }
  };

  // Existing interaction handlers
  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: Motion.duration.micro });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: Motion.duration.micro });
  };

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={animatedContainerStyle}>
        <GlassCard style={styles.container} intensity={30} variant="highlight">
          <View style={styles.header}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {walletConnected ? identityStatus.toUpperCase() : 'OFFLINE'}
            </Text>
          </View>
          
          <Text style={styles.title}>{displayName}</Text>
          <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="middle">
            {walletConnected || identity.isAuthenticated ? displayAddress : 'Connect Seeker to activate'}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>TRUST SCORE</Text>
              <Text style={styles.statValue}>
                {identityData ? (identityData.riskScore).toFixed(1) : '--.-'}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>AGG. BALANCE</Text>
              <Text style={styles.statValue}>
                {identity.getAggregatedBalance().toFixed(1)}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>ACCESS</Text>
              <Text style={[styles.statValue, { textTransform: 'uppercase', fontSize: 10 }]}>
                {identityData ? identityData.verificationLevel : '-'}
              </Text>
            </View>
          </View>
        </GlassCard>
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: Theme.spacing.lg,
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 14 
  },
  statusDot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    marginRight: 8 
  },
  statusText: { 
    fontSize: 10, 
    letterSpacing: 2.5, 
    fontWeight: '800' 
  },
  title: { 
    color: Theme.colors.text.high, 
    fontSize: 26, 
    fontWeight: '300', 
    marginBottom: 6,
    letterSpacing: -0.8
  },
  subtitle: { 
    color: Theme.colors.text.low, 
    fontSize: 13, 
    marginBottom: 28,
    opacity: 0.8
  },
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    borderTopWidth: 1, 
    borderTopColor: Theme.colors.border, 
    paddingTop: 18 
  },
  statLabel: { 
    color: Theme.colors.text.low, 
    fontSize: 9, 
    letterSpacing: 1.5, 
    marginBottom: 6,
    opacity: 0.6
  },
  statValue: { 
    color: Theme.colors.text.high, 
    fontSize: 16, 
    fontWeight: '700' 
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
});
