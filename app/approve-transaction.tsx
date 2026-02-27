import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { 
  FadeOut,
  SlideInDown,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  useSharedValue,
  Easing,
  interpolate
} from 'react-native-reanimated';
import { Theme } from '../src/theme';
import { RiskIndicator } from '../src/components/RiskIndicator';
import { ConfirmationSlider } from '../src/components/ConfirmationSlider';
import { BiometricModal } from '../src/components/BiometricModal';
import { transactionService } from '../src/services/transactionService';
import { biometricService } from '../src/services/biometricService';
import { behaviorEngine } from '../src/services/behaviorEngine';
import { useAppStore } from '../src/store/useAppStore';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ApproveTransactionModal() {
  const params = useLocalSearchParams();
  const pendingTransaction = useAppStore(state => state.pendingTransaction);
  const isProcessingTransaction = useAppStore(state => state.isProcessingTransaction);
  const identityData = useAppStore(state => state.identityData);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<any>(null);
  
  const pulse = useSharedValue(0);

  useEffect(() => {
    const init = async () => {
      // If it's a DEMO type, the service already set the pending transaction
      if (params.type !== 'DEMO' || !pendingTransaction) {
        const tx = await transactionService.simulateTransaction((params.type as any) || 'transfer');
        const evaluation = behaviorEngine.evaluateTransaction(tx, identityData);
        setInsight(evaluation);
      } else {
        // For DEMO scenarios, the insight is already set in the store
        setInsight(useAppStore.getState().securityInsight);
      }
      setLoading(false);
      
      pulse.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );
    };
    init();
  }, [params.type]);

  const handleApprove = useCallback(async () => {
    const threat = insight?.threatLevel || 'low';
    
    // High-risk transactions or approvals require biometrics
    if (threat === 'high' || threat === 'medium') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      const authenticated = await biometricService.authenticateUser(threat);
      if (!authenticated) {
        Alert.alert('Authentication Denied', 'Transaction signature aborted for security.');
        router.back();
        return;
      }
    }

    const success = await transactionService.approveTransaction();
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => router.back(), 800);
    }
  }, [insight]);

  const handleReject = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await transactionService.rejectTransaction();
    router.back();
  }, []);

  const animatedGlow = useAnimatedStyle(() => {
    const risk = pendingTransaction?.riskLevel || 'low';
    const color = risk === 'high' ? '#EF4444' : (risk === 'medium' ? '#F59E0B' : Theme.colors.primary);
    const opacity = interpolate(pulse.value, [0, 1], [0.3, 0.7]);
    const radius = interpolate(pulse.value, [0, 1], [10, 25]);
    
    return {
      borderColor: color,
      shadowColor: color,
      shadowOpacity: opacity,
      shadowRadius: radius,
      borderWidth: 2,
    };
  });

  if (loading || !pendingTransaction) {
    return (
      <View style={styles.loadingContainer}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={['#000', '#1a1a1a']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>SOLANA NETWORK ANALYSIS...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
      
      <Animated.View 
        entering={SlideInDown.springify().damping(20).stiffness(120)}
        exiting={FadeOut}
        style={styles.modalContent}
      >
        <LinearGradient
          colors={['#111', '#000']}
          style={[styles.gradient, animatedGlow]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>MWA Authorization</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>SEEKER HARDWARE</Text>
            </View>
          </View>

          <View style={styles.mainCard}>
            <Text style={styles.typeLabel}>{pendingTransaction.type.replace('_', ' ')}</Text>
            <Text style={styles.summaryText}>{pendingTransaction.summary}</Text>
            
            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Estimated Fee</Text>
                <Text style={styles.detailValue}>{pendingTransaction.fee}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={[styles.detailValue, { color: Theme.colors.accent }]}>Simulated (No RPC)</Text>
              </View>
            </View>
          </View>

          <RiskIndicator level={pendingTransaction.riskLevel} />

          {insight && (
            <View style={[
              styles.aiInsightBox, 
              insight.threatLevel === 'high' && { borderLeftColor: '#EF4444' }
            ]}>
              <Text style={styles.aiInsightTitle}>AI THREAT EVALUATION</Text>
              <Text style={styles.aiInsightText}>{insight.insightMessage}</Text>
            </View>
          )}

          <View style={styles.footer}>
            {isProcessingTransaction ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator color={Theme.colors.primary} />
                <Text style={styles.processingText}>FINALIZING ON-CHAIN...</Text>
              </View>
            ) : (
              <>
                <ConfirmationSlider 
                  onConfirm={handleApprove} 
                  isLoading={isProcessingTransaction} 
                />
                <TouchableOpacity 
                  onPress={handleReject} 
                  style={styles.cancelBtn}
                  disabled={isProcessingTransaction}
                >
                  <Text style={styles.cancelText}>REJECT AND ABORT</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </LinearGradient>
      </Animated.View>

      <BiometricModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Theme.colors.text.low,
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 20,
    fontWeight: '800'
  },
  modalContent: {
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.9,
    borderRadius: 36,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
  },
  gradient: {
    padding: 28,
    borderRadius: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: -0.5,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  badgeText: {
    color: Theme.colors.text.medium,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  mainCard: {
    marginBottom: 20,
  },
  typeLabel: {
    color: Theme.colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  summaryText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 30,
    marginBottom: 20,
  },
  detailsBox: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    color: Theme.colors.text.low,
    fontSize: 12,
  },
  detailValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  aiInsightBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.primary,
  },
  aiInsightTitle: {
    color: Theme.colors.text.low,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  aiInsightText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '300'
  },
  footer: {
    marginTop: 24,
    minHeight: 120,
    justifyContent: 'center'
  },
  processingContainer: {
    alignItems: 'center',
    gap: 16
  },
  processingText: {
    color: Theme.colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2
  },
  cancelBtn: {
    marginTop: 18,
    alignItems: 'center',
    paddingVertical: 10
  },
  cancelText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5
  }
});
