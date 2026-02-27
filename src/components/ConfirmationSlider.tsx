import React, { useState } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  runOnJS, 
  interpolate,
  Extrapolate,
  withTiming,
  FadeIn
} from 'react-native-reanimated';
import { Theme } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH - 64;
const KNOB_SIZE = 56;
const SUCCESS_THRESHOLD = SLIDER_WIDTH - KNOB_SIZE - 8;

interface ConfirmationSliderProps {
  onConfirm: () => void;
  isLoading?: boolean;
}

export const ConfirmationSlider: React.FC<ConfirmationSliderProps> = ({ onConfirm, isLoading }) => {
  const translateX = useSharedValue(0);
  const [completed, setCompleted] = useState(false);

  const handleConfirm = () => {
    setCompleted(true);
    onConfirm();
  };

  const gesture = Gesture.Pan()
    .enabled(!isLoading && !completed)
    .onUpdate((event) => {
      const val = Math.max(0, Math.min(event.translationX, SUCCESS_THRESHOLD));
      
      // Haptic tick as you move
      if (Math.floor(val / 20) !== Math.floor(translateX.value / 20)) {
        runOnJS(Haptics.selectionAsync)();
      }
      
      translateX.value = val;
    })
    .onEnd(() => {
      if (translateX.value > SUCCESS_THRESHOLD * 0.9) {
        translateX.value = withSpring(SUCCESS_THRESHOLD, Theme.animation.spring.tactile);
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
        runOnJS(handleConfirm)();
      } else {
        translateX.value = withSpring(0, Theme.animation.spring.tactile);
      }
    });

  const animatedKnobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    borderRadius: interpolate(translateX.value, [0, SUCCESS_THRESHOLD], [20, 24], Extrapolate.CLAMP)
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SUCCESS_THRESHOLD * 0.5], [0.6, 0], Extrapolate.CLAMP),
    transform: [{ translateX: interpolate(translateX.value, [0, SUCCESS_THRESHOLD], [0, 40], Extrapolate.CLAMP) }]
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: translateX.value + KNOB_SIZE + 4,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View style={[styles.progress, animatedProgressStyle]}>
          <LinearGradient
            colors={[Theme.colors.primary + '22', Theme.colors.primary + '88']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        
        {!completed ? (
          <Animated.Text style={[styles.label, animatedTextStyle]}>
            SLIDE TO AUTHORIZE
          </Animated.Text>
        ) : (
          <Animated.View entering={FadeIn} style={styles.completedContainer}>
            <Text style={styles.completedText}>TRANSACTION BROADCASTED</Text>
          </Animated.View>
        )}

        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.knob, animatedKnobStyle]}>
            <LinearGradient
              colors={[Theme.colors.primary, '#7C3AED']}
              style={styles.knobGradient}
            >
              {completed ? (
                <View style={styles.checkIcon} />
              ) : (
                <View style={styles.arrow} />
              )}
            </LinearGradient>
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 72,
    marginTop: 20,
  },
  track: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    padding: 4,
    overflow: 'hidden',
  },
  progress: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 24,
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: 20,
    elevation: 4,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  knobGradient: {
    flex: 1,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  completedContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center'
  },
  completedText: {
    color: Theme.colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  arrow: {
    width: 14,
    height: 14,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#fff',
    transform: [{ rotate: '45deg' }, { translateX: -2 }],
  },
  checkIcon: {
    width: 20,
    height: 10,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#fff',
    transform: [{ rotate: '-45deg' }, { translateY: -2 }],
  }
});
