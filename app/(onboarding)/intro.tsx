import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  Easing, 
  useAnimatedStyle,
  interpolate
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Theme } from '../../src/theme';
import { SeekerButton } from '../../src/components/SeekerButton';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { FadeInView } from '../../src/animations/FadeInView';

const { width, height } = Dimensions.get('window');

export default function IntroScreen() {
  const router = useRouter();
  
  // Background Gradient Animation
  const gradientRotate = useSharedValue(0);
  
  useEffect(() => {
    gradientRotate.value = withRepeat(
      withTiming(360, { 
        duration: 20000, 
        easing: Easing.linear 
      }),
      -1,
      false
    );
  }, []);

  const bgStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${gradientRotate.value}deg` }, { scale: 1.5 }]
  }));

  return (
    <View style={styles.container}>
      {/* Animated Gradient Drift Background */}
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
        <LinearGradient
          colors={['#0B0F1A', '#1A103C', '#0B0F1A']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <View style={styles.content}>
        <FadeInView delay={300}>
          <GlassCard style={styles.loginCard} intensity={40} variant="highlight">
            <View style={styles.titleContainer}>
              <Text style={styles.headline}>So1ana</Text>
              <Text style={styles.secondaryTitle}> Hub</Text>
            </View>
            <Text style={styles.tagline}>Unified Solana Identity</Text>

            <View style={styles.spacer} />            
            <SeekerButton 
              title="Enter Hub" 
              onPress={() => router.push('/(onboarding)/identity')} 
              style={styles.primaryBtn}
            />
          </GlassCard>
        </FadeInView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    paddingHorizontal: Theme.spacing.lg,
    maxWidth: 400,
  },
  loginCard: {
    paddingVertical: 48,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  headline: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255,255,255,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  secondaryTitle: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '400',
    letterSpacing: 1,
  },
  tagline: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.8,
    marginBottom: 44,
  },
  spacer: {
    height: 20,
  },
  primaryBtn: {
    width: '100%',
    borderRadius: 28,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  }
});
