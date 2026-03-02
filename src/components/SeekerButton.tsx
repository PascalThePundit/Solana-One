import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Theme } from '../theme';

interface SeekerButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const SeekerButton = React.memo(({ title, onPress, variant = 'primary', style, disabled, children }: SeekerButtonProps) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : 1
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(0.96, { damping: 15 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, { damping: 15 });
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return { 
          backgroundColor: Theme.colors.surface, 
          borderColor: Theme.colors.text.low, 
          borderWidth: 1 
        };
      case 'outline':
        return { 
          backgroundColor: 'transparent', 
          borderColor: Theme.colors.primary, 
          borderWidth: 1 
        };
      default:
        return { 
          backgroundColor: Theme.colors.primary 
        };
    }
  };

  return (
    <Pressable 
      onPressIn={handlePressIn} 
      onPressOut={handlePressOut} 
      onPress={disabled ? undefined : onPress}
    >
      <Animated.View style={[styles.button, getVariantStyle(), animatedStyle, style]}>
        {title ? (
          <Text style={[
            styles.text, 
            variant === 'primary' ? { color: '#000' } : { color: '#fff' },
            variant === 'outline' && { color: Theme.colors.primary }
          ]}>
            {title}
          </Text>
        ) : null}
        {children}
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  button: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        // @ts-ignore - boxShadow is supported on web
        boxShadow: `0px 4px 12px ${Theme.colors.primary}33`,
      }
    }),
  },
  text: { 
    color: '#000', 
    fontWeight: '800', 
    fontSize: 14, 
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
