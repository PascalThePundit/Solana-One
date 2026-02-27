import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  withTiming, 
  withDelay, 
  withSequence,
  Easing, 
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  runOnJS
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const DOT_SIZE = 14;
const CONTAINER_SIZE = 60;

// Premium Apple-style timing
const CUBIC_BEZIER = Easing.bezier(0.25, 1, 0.5, 1);

export default function OnboardingSplash() {
  const router = useRouter();

  useEffect(() => {
    // Navigate immediately to the intro since the real splash is handled elsewhere
    router.replace('/(onboarding)/intro');
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#121212']}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: CONTAINER_SIZE,
    height: CONTAINER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  dotsWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    padding: 8,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  dotTopLeft: {},
  dotTopRight: {},
  dotBottomLeft: {},
  dotBottomRight: {},
  
  solidOneWrapper: {
    position: 'absolute',
    width: 20, // Width of the "1" stem
    height: 60, // Height of the "1"
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidOne: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  glowOne: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 6,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    opacity: 0.5,
  },
  textContainer: {
    alignItems: 'center',
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '600',
    letterSpacing: -0.5,
    fontFamily: 'System', // Use system font for iOS feel
  },
  subtitleText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginTop: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
  }
});

