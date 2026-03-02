import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../theme';

interface IdentityBadgeProps {
  handle: string;
  size?: number;
  style?: ViewStyle;
}

export const IdentityBadge: React.FC<IdentityBadgeProps> = ({ handle, size = 48, style }) => {
  const initial = handle.charAt(0).toUpperCase();

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={[`${Theme.colors.primary}40`, 'transparent']}
        style={StyleSheet.absoluteFill}
      />
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
      
      {/* Soft Glow */}
      <View style={[styles.glow, { width: size * 0.8, height: size * 0.8, borderRadius: size * 0.4 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  initial: {
    color: '#fff',
    fontWeight: '800',
    zIndex: 1,
  },
  glow: {
    position: 'absolute',
    backgroundColor: Theme.colors.primary,
    opacity: 0.15,
  },
});
