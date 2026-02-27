import React from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  withTiming, 
  useSharedValue, 
  withRepeat, 
  Easing, 
  interpolate 
} from 'react-native-reanimated';
import { Theme } from '../../theme';

interface GlassCardProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  borderRadius?: number;
  variant?: 'default' | 'highlight' | 'liquid';
  tint?: 'light' | 'dark' | 'default';
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  style, 
  intensity = 60,
  borderRadius = 32,
  variant = 'liquid',
  tint = 'dark'
}) => {
  const glow = useSharedValue(0);

  React.useEffect(() => {
    glow.value = withRepeat(
      withTiming(1, { 
        duration: 4000, 
        easing: Easing.inOut(Easing.sin) 
      }),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.3, 0.6]),
  }));

  const rimLightStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.5, 0.8]),
  }));

  return (
    <Animated.View style={[styles.container, { borderRadius }, style]}>
      {/* 1. Base Layer: Deep depth gradient */}
      <LinearGradient
        colors={tint === 'dark' ? ['rgba(20,20,20,0.8)', 'rgba(5,5,5,0.9)'] : ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />

      {/* 2. Blur Layer: High-end refraction */}
      <BlurView 
        intensity={intensity} 
        tint={tint === 'default' ? 'dark' : tint} 
        style={[StyleSheet.absoluteFill, { borderRadius }]} 
      />

      {/* 3. Rim Light: Refractive edge highlight (Liquid Glass signature) */}
      <Animated.View style={[StyleSheet.absoluteFill, { borderRadius, overflow: 'hidden' }, rimLightStyle]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255,255,255,0.3)', 'transparent', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 0.6 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* 4. Variant Glows */}
      {(variant === 'highlight' || variant === 'liquid') && (
        <Animated.View style={[StyleSheet.absoluteFill, { borderRadius, overflow: 'hidden' }, glowStyle]} pointerEvents="none">
           <LinearGradient
            colors={[
              variant === 'liquid' ? `${Theme.colors.primary}15` : `${Theme.colors.primary}25`, 
              'transparent'
            ]}
            start={{ x: 1, y: 1 }}
            end={{ x: 0.2, y: 0.2 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}

      {/* 5. Liquid Border: Double-layered for depth */}
      <View style={[styles.outerBorder, { borderRadius, borderColor: 'rgba(255,255,255,0.1)' }]} pointerEvents="none" />
      <View style={[styles.innerBorder, { borderRadius: borderRadius - 1, borderColor: 'rgba(255,255,255,0.05)' }]} pointerEvents="none" />

      {/* Content Container */}
      <View style={styles.content}>
        {children}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      }
    }),
  },
  outerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    zIndex: 10,
  },
  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    borderWidth: 0.5,
    zIndex: 9,
  },
  content: {
    zIndex: 20,
    padding: Theme.spacing.md,
  }
});

