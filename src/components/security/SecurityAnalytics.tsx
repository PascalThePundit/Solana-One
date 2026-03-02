import React, { useMemo, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Platform,
  Linking
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  useSharedValue, 
  interpolateColor,
  FadeInDown,
  FadeInUp
} from 'react-native-reanimated';
import { Canvas, Path, Skia, Text as SkiaText, useFont, vec } from '@shopify/react-native-skia';
import { useIdentityStore } from '../../store/identityStore';
import { Theme } from '../../theme';
import { GlassCard } from '../../components/ui/GlassCard';
import { IconSymbol } from '../../../components/ui/icon-symbol';

const { width } = Dimensions.get('window');

// --- 1. Score Ring Component ---
const ScoreRing = ({ score, riskLevel }: { score: number, riskLevel: string }) => {
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  
  const progress = useSharedValue(0);
  
  React.useEffect(() => {
    progress.value = withSpring(score / 100, { damping: 15 });
  }, [score]);

  const path = useMemo(() => {
    const p = Skia.Path.Make();
    p.addCircle(center, center, radius);
    return p;
  }, [radius, center]);

  const color = useMemo(() => {
    if (riskLevel === 'High') return '#FF3B30';
    if (riskLevel === 'Moderate') return '#FF9500';
    return '#34C759';
  }, [riskLevel]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Canvas style={{ width: size, height: size }}>
        <Path
          path={path}
          color="rgba(255,255,255,0.1)"
          style="stroke"
          strokeWidth={strokeWidth}
        />
        <Path
          path={path}
          color={color}
          style="stroke"
          strokeWidth={strokeWidth}
          strokeCap="round"
          start={0}
          end={progress}
        />
      </Canvas>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={[styles.scoreText, { color }]}>{Math.round(score)}</Text>
        <Text style={styles.scoreLabel}>IDENTITY SCORE</Text>
      </View>
    </View>
  );
};

// --- 2. Security Banner ---
const SecurityBanner = ({ riskLevel }: { riskLevel: string }) => {
  const status = riskLevel === 'High' ? 'CRITICAL' : riskLevel === 'Moderate' ? 'SUSPICIOUS' : 'SECURE';
  const color = riskLevel === 'High' ? '#FF3B30' : riskLevel === 'Moderate' ? '#FF9500' : '#34C759';

  return (
    <Animated.View entering={FadeInUp} style={[styles.banner, { backgroundColor: `${color}20`, borderColor: `${color}40` }]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.bannerText, { color }]}>SYSTEM STATUS: {status}</Text>
    </Animated.View>
  );
};

// --- 3. Wallet List Item ---
const WalletItem = ({ wallet, index }: { wallet: any, index: number }) => {
  const lastActive = new Date(wallet.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return (
    <Animated.View entering={FadeInDown.delay(index * 100)} style={styles.walletItem}>
      <View style={styles.walletHeader}>
        <IconSymbol name="wallet.pass.fill" size={20} color={Theme.colors.text.medium} />
        <Text style={styles.walletName}>{wallet.name}</Text>
        <View style={styles.riskBadge}>
          <Text style={styles.riskBadgeText}>SECURE</Text>
        </View>
      </View>
      <Text style={styles.walletAddress}>{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</Text>
      <View style={styles.activityRow}>
        <View style={styles.activityTrack}>
          <LinearGradient
            colors={[Theme.colors.accent, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.activityFill, { width: '70%' }]}
          />
        </View>
        <Text style={styles.lastActiveText}>{lastActive}</Text>
      </View>
    </Animated.View>
  );
};

// --- 4. Risk Timeline Item ---
const RiskItem = ({ alert, index }: { alert: any, index: number }) => {
  const color = alert.riskLevel >= 4 ? '#FF3B30' : '#FF9500';
  const time = new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Animated.View entering={FadeInDown.delay(index * 50)} style={styles.riskItem}>
      <View style={[styles.riskIconContainer, { backgroundColor: `${color}20` }]}>
        <IconSymbol name="exclamationmark.triangle.fill" size={16} color={color} />
      </View>
      <View style={styles.riskContent}>
        <Text style={styles.riskDescription}>{alert.description}</Text>
        <Text style={styles.riskMeta}>{alert.wallet.slice(0, 4)}... • {time}</Text>
      </View>
      <TouchableOpacity 
        style={styles.explorerButton}
        onPress={() => Linking.openURL(`https://solscan.io/tx/${alert.signature}`)}
      >
        <IconSymbol name="arrow.up.right" size={14} color={Theme.colors.text.medium} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// --- Main Dashboard Screen ---
export const SecurityDashboard = () => {
  const { intelligence, wallets, alerts, handle } = useIdentityStore();
  
  const score = intelligence?.identityScore ?? 0;
  const riskLevel = intelligence?.riskLevel ?? 'Low';

  const onResolveAll = useCallback(() => {
    // Local state update logic would go here
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0A0F', '#000000']}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Security Analytics</Text>
          <SecurityBanner riskLevel={riskLevel} />
        </View>

        {/* Identity Overview */}
        <GlassCard variant="liquid" style={styles.overviewCard}>
          <View style={styles.overviewTop}>
            <View>
              <Text style={styles.handleText}>@{handle || 'anonymous'}</Text>
              <Text style={styles.riskLevelText}>
                Risk Level: <Text style={{ color: riskLevel === 'High' ? '#FF3B30' : '#34C759' }}>{riskLevel}</Text>
              </Text>
              <View style={styles.walletCountRow}>
                <IconSymbol name="link" size={14} color={Theme.colors.text.low} />
                <Text style={styles.walletCountText}>{wallets.length} Wallets Linked</Text>
              </View>
            </View>
            <ScoreRing score={score} riskLevel={riskLevel} />
          </View>
        </GlassCard>

        {/* Linked Wallets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Linked Wallets</Text>
          <GlassCard style={styles.walletCard}>
            {wallets.map((w, i) => (
              <WalletItem key={w.id} wallet={w} index={i} />
            ))}
          </GlassCard>
        </View>

        {/* Risk Timeline */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Security Incidents</Text>
            <TouchableOpacity onPress={onResolveAll}>
              <Text style={styles.resolveAll}>Resolve All</Text>
            </TouchableOpacity>
          </View>
          
          {alerts.length > 0 ? (
            <GlassCard style={styles.timelineCard}>
              {alerts.map((a, i) => (
                <RiskItem key={a.signature} alert={a} index={i} />
              ))}
            </GlassCard>
          ) : (
            <GlassCard style={styles.emptyCard}>
              <IconSymbol name="checkmark.shield.fill" size={32} color="#34C759" />
              <Text style={styles.emptyText}>No recent threats detected</Text>
            </GlassCard>
          )}
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  bannerText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  overviewCard: {
    marginBottom: 24,
  },
  overviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  handleText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  riskLevelText: {
    fontSize: 14,
    color: Theme.colors.text.medium,
    marginBottom: 12,
  },
  walletCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletCountText: {
    fontSize: 13,
    color: Theme.colors.text.low,
  },
  scoreText: {
    fontSize: 42,
    fontWeight: '800',
    marginTop: -5,
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Theme.colors.text.low,
    letterSpacing: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  resolveAll: {
    fontSize: 14,
    color: Theme.colors.accent,
    fontWeight: '500',
  },
  walletCard: {
    padding: 0,
  },
  walletItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  walletName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    flex: 1,
  },
  riskBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  riskBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34C759',
  },
  walletAddress: {
    fontSize: 12,
    color: Theme.colors.text.low,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 12,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  activityTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  activityFill: {
    height: '100%',
    borderRadius: 2,
  },
  lastActiveText: {
    fontSize: 11,
    color: Theme.colors.text.low,
  },
  timelineCard: {
    padding: 0,
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  riskIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  riskContent: {
    flex: 1,
  },
  riskDescription: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
    marginBottom: 2,
  },
  riskMeta: {
    fontSize: 12,
    color: Theme.colors.text.low,
  },
  explorerButton: {
    padding: 8,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: Theme.colors.text.medium,
  }
});
