import React from 'react';
import { StyleSheet, Text, Pressable, ViewStyle, TextStyle } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  interpolateColor,
  interpolate
} from 'react-native-reanimated';
import { LiquidGlassSurface } from './LiquidGlassSurface';

interface LiquidGlassButtonProps {
  title: string;
  onPress?: () => void;
  width?: number;
  height?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
  mode?: 'light' | 'dark';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const LiquidGlassButton: React.FC<LiquidGlassButtonProps> = ({
  title,
  onPress,
  width = 200,
  height = 56,
  style,
  textStyle,
  mode = 'dark'
}) => {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, 0.96]) }],
    opacity: interpolate(pressed.value, [0, 1], [1, 0.8]),
  }));

  return (
    <AnimatedPressable
      onPressIn={() => (pressed.value = withTiming(1, { duration: 150 }))}
      onPressOut={() => (pressed.value = withTiming(0, { duration: 200 }))}
      onPress={onPress}
      style={[animatedStyle, style]}
    >
      <LiquidGlassSurface width={width} height={height} borderRadius={18} mode={mode} pressed={pressed}>
        <Text style={[styles.text, textStyle]}>{title}</Text>
      </LiquidGlassSurface>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});
