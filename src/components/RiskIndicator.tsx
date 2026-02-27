import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  interpolateColor 
} from 'react-native-reanimated';
import { Theme } from '../theme';

interface RiskIndicatorProps {
  level: 'low' | 'medium' | 'high';
}

export const RiskIndicator: React.FC<RiskIndicatorProps> = ({ level }) => {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: Theme.animation.duration.breathing / 2 }),
      -1,
      true
    );
  }, []);

  const colorMap = {
    low: Theme.colors.accent,
    medium: '#F59E0B',
    high: '#EF4444'
  };

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = level === 'high' ? 0.4 + pulse.value * 0.4 : 0.2;
    const shadowOpacity = level === 'high' ? 0.6 + pulse.value * 0.4 : 0.3;
    
    return {
      borderColor: colorMap[level],
      backgroundColor: `${colorMap[level]}1A`,
      shadowColor: colorMap[level],
      shadowOpacity: shadowOpacity,
      shadowRadius: level === 'high' ? 10 + pulse.value * 10 : 5,
      opacity: 1
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={[styles.dot, { backgroundColor: colorMap[level] }]} />
      <Text style={[styles.text, { color: colorMap[level] }]}>
        {level.toUpperCase()} RISK DETECTED
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  text: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  }
});
