import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Modal, Dimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
  ScaleInCenter,
  ScaleOutCenter,
  interpolate
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Theme } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export const BiometricModal = () => {
  const isBiometricActive = useAppStore(state => state.isBiometricActive);
  const biometricStatus = useAppStore(state => state.biometricStatus);
  const scanLine = useSharedValue(-70);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isBiometricActive && biometricStatus === 'scanning') {
      scanLine.value = withRepeat(
        withTiming(70, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );
    } else {
      scanLine.value = -70;
    }
    
    if (biometricStatus === 'success') {
      scale.value = withSequence(
        withTiming(1.1, { 
          duration: 200, 
          easing: Easing.inOut(Easing.quad) 
        }),
        withTiming(1, { 
          duration: 200, 
          easing: Easing.inOut(Easing.quad) 
        })
      );
    }
  }, [isBiometricActive, biometricStatus]);

  const animatedLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLine.value }],
    opacity: biometricStatus === 'scanning' ? 1 : 0
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  if (!isBiometricActive) return null;

  return (
    <Modal transparent visible={isBiometricActive} animationType="none">
      <View style={styles.container}>
        <Animated.View entering={FadeIn} exiting={FadeOut} style={StyleSheet.absoluteFill}>
          <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
        </Animated.View>

        <Animated.View 
          entering={ScaleInCenter.springify().damping(18).stiffness(120)}
          exiting={ScaleOutCenter}
          style={[styles.modalContent, animatedContentStyle]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'rgba(0,0,0,0.2)']}
            style={StyleSheet.absoluteFill}
          />
          
          <View style={styles.iconContainer}>
            <View style={[
              styles.faceBounds,
              biometricStatus === 'success' && styles.successBounds,
              biometricStatus === 'failure' && styles.failureBounds
            ]}>
              {/* Mock Face ID Icon */}
              <View style={styles.faceIcon}>
                <View style={styles.eyeRow}>
                  <View style={styles.eye} />
                  <View style={styles.eye} />
                </View>
                <View style={styles.nose} />
                <View style={styles.mouth} />
              </View>

              <Animated.View style={[styles.scanLine, animatedLineStyle]} />
            </View>
            
            <View style={styles.statusBox}>
              {biometricStatus === 'scanning' && (
                <Text style={styles.statusText}>AUTHENTICATING...</Text>
              )}
              {biometricStatus === 'success' && (
                <View style={styles.successRow}>
                  <View style={styles.checkIcon} />
                  <Text style={[styles.statusText, { color: Theme.colors.accent }]}>IDENTITY VERIFIED</Text>
                </View>
              )}
              {biometricStatus === 'failure' && (
                <Text style={[styles.statusText, { color: '#EF4444' }]}>HARDWARE TIMEOUT</Text>
              )}
            </View>
          </View>
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
  },
  modalContent: {
    width: 240,
    height: 280,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconContainer: {
    alignItems: 'center',
  },
  faceBounds: {
    width: 110,
    height: 110,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  successBounds: {
    borderColor: Theme.colors.accent,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  failureBounds: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  faceIcon: {
    width: 60,
    height: 60,
    opacity: 0.3,
    alignItems: 'center'
  },
  eyeRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 15
  },
  eye: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff'
  },
  nose: {
    width: 4,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#fff',
    marginTop: 8
  },
  mouth: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
    marginTop: 8
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 3,
    backgroundColor: Theme.colors.primary,
    shadowColor: Theme.colors.primary,
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  statusBox: {
    height: 20,
    justifyContent: 'center'
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    opacity: 0.6
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  checkIcon: {
    width: 12,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: Theme.colors.accent,
    transform: [{ rotate: '-45deg' }, { translateY: -2 }],
  }
});
