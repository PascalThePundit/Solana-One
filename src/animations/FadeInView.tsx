import React, { useEffect } from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withDelay, 
  Easing,
  EasingFunction 
} from 'react-native-reanimated';
import { Theme } from '../theme';

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'none';
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

export const FadeInView: React.FC<FadeInViewProps> = ({ 
  children, 
  delay = 0, 
  direction = 'up',
  duration = Theme?.animation?.duration?.medium ?? 500,
  style
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(direction === 'none' ? 0 : direction === 'up' ? 20 : -20);

  useEffect(() => {
    const standardEasing = Theme?.animation?.easing?.standard;
    
    // In Reanimated 4, we let the type be inferred or use the easing directly
    const activeEasing = standardEasing || Easing.bezier(0.25, 0.1, 0.25, 1);

    opacity.value = withDelay(delay, withTiming(1, { 
      duration: duration,
      easing: activeEasing 
    }));
    
    if (direction !== 'none') {
      translateY.value = withDelay(delay, withTiming(0, { 
        duration: duration,
        easing: Easing.out(Easing.quad)
      }));
    }
  }, [delay, direction, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Safely merge styles
  const combinedStyle = style ? [animatedStyle, style] : animatedStyle;

  return (
    <Animated.View style={combinedStyle}>
      {children}
    </Animated.View>
  );
};
