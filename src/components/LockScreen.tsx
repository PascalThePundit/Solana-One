import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { 
  FadeIn, 
  FadeOut, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  useAnimatedStyle, 
  Easing 
} from 'react-native-reanimated';
import { GlassCard } from './ui/GlassCard';
import { SeekerButton } from './SeekerButton';
import { Theme } from '../theme';
import { sessionManager } from '../security/sessionManager';
import { useIdentityStore } from '../store/identityStore';
import { useAppStore } from '../store/useAppStore';

export const LockScreen = () => {
  const isLocked = useIdentityStore(state => state.isLocked);
  const isAuthenticated = useIdentityStore(state => state.isAuthenticated);
  const isBiometricActive = useAppStore(state => state.isBiometricActive);

  const glow = useSharedValue(0.5);

  useEffect(() => {
    glow.value = withRepeat(
      withTiming(1, { 
        duration: 2000, 
        easing: Easing.inOut(Easing.sin) 
      }),
      -1,
      true
    );
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: glow.value }]
  }));

  // Only show if locked, authenticated, and the biometric modal itself isn't already covering the screen
  if (!isAuthenticated || !isLocked || isBiometricActive) return null;

  return (
    <Modal transparent visible={isLocked} animationType="none">
      <View style={styles.container}>
        <Animated.View entering={FadeIn} exiting={FadeOut} style={StyleSheet.absoluteFill}>
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        </Animated.View>

        <Animated.View 
          entering={FadeIn.delay(200)} 
          exiting={FadeOut}
          style={styles.content}
        >
          <GlassCard style={styles.glass} intensity={40} borderRadius={32}>
            <View style={styles.inner}>
              <Animated.View style={[styles.lockIconContainer, iconStyle]}>
                 <View style={styles.fingerprintRing} />
                 <View style={styles.fingerprintCore} />
              </Animated.View>
              
              <Text style={styles.title}>LOCKED</Text>
              
              <SeekerButton 
                title="Unlock Identity" 
                onPress={() => sessionManager.authenticateBiometrics()} 
                style={styles.button}
              />
            </View>
          </GlassCard>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  content: {
    width: '100%',
    maxWidth: 340,
  },
  glass: {
    padding: 32,
    alignItems: 'center',
  },
  inner: {
    alignItems: 'center',
    width: '100%',
  },
  lockIconContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  fingerprintRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    opacity: 0.5,
  },
  fingerprintCore: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Theme.colors.primary,
    opacity: 0.8,
  },
  title: {
    color: Theme.colors.text.high,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 4,
    marginBottom: 32,
  },
  button: {
    width: '100%',
    borderRadius: 24,
  },
});
