import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  interpolateColor,
  interpolate,
  Easing,
  withSequence
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Theme } from '../../theme';
import { useAppStore } from '../../store/useAppStore';
import { GlassCard } from '../ui/GlassCard';

export const SecurityInsightCard = React.memo(() => {
  // Existing state hooks
  const securityInsight = useAppStore((state) => state.securityInsight);
  
  // Animation Values
  const pulse = useSharedValue(0);
  const glowIntensity = useSharedValue(0);

  useEffect(() => {
    // Pulse animation
    pulse.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );

    // Subtle erratic intensity (simulates AI processing)
    const interval = setInterval(() => {
      glowIntensity.value = withTiming(Math.random(), { duration: 800 });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Enhanced Animated Styles (Additive)
  const animatedStyle = useAnimatedStyle(() => {
    // Safe access in worklet
    const scale = interpolate(pulse.value, [0, 1], [1, 1.018]);
    
    return {
      transform: [{ scale }]
    };
  });

  const aiDotStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowIntensity.value, [0, 1], [0.3, 1]),
    transform: [{ scale: interpolate(glowIntensity.value, [0, 1], [0.8, 1.2]) }]
  }));
  
  // Guard clause moved after hooks
  if (!securityInsight) return null;

  // Existing helper function preserved & enhanced
  const getThreatColor = () => {
    switch (securityInsight.threatLevel) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      default: return Theme.colors.primary;
    }
  };

  // Existing interaction handler
  const handleAction = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const isHighRisk = securityInsight.threatLevel === 'high';

  return (
    <Animated.View style={animatedStyle}>
      <GlassCard 
        intensity={35} 
        variant={isHighRisk ? 'highlight' : 'default'}
        style={[styles.container, { borderColor: `${getThreatColor()}44` }]}
      >
        <View style={styles.header}>
          <Animated.View style={[styles.indicator, { backgroundColor: getThreatColor() }, aiDotStyle]} />
          <Text style={styles.headerText}>AI SECURITY ENGINE</Text>
        </View>

        <Text style={styles.insightMessage}>{securityInsight.insightMessage}</Text>
        
        <Pressable 
          style={styles.actionBtn}
          onPress={handleAction}
        >
          <Text style={[styles.actionText, { color: getThreatColor() }]}>
            {securityInsight.recommendedAction}
          </Text>
          <View style={[styles.underline, { backgroundColor: getThreatColor() }]} />
        </Pressable>
      </GlassCard>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: Theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 4,
    shadowOpacity: 1,
  },
  headerText: {
    color: Theme.colors.text.low,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.5,
    opacity: 0.7
  },
  insightMessage: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '300',
    lineHeight: 24,
    marginBottom: 18,
    letterSpacing: -0.3
  },
  actionBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  underline: {
    height: 1,
    width: '100%',
    opacity: 0.3,
    marginTop: 2
  }
});
