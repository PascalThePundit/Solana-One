import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions, Text, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassSurface } from '../src/components/ui/GlassSurface';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete?: () => void;
}

const ORB_SIZE = 22;
const RADIUS = 45;

export default function SplashScreen({ onAnimationComplete }: SplashScreenProps) {
  // Animation shared values
  const orbScale = useSharedValue(0);
  const orbPositionState = useSharedValue(0); // 0: Start, 1: Circle, 2: Line, 3: "1"
  const orbPulse = useSharedValue(1);
  const textOpacity = useSharedValue(0);
  const textSlide = useSharedValue(0); // 0 to 1
  const hubOpacity = useSharedValue(0);
  const groupTranslateX = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(20);

  useEffect(() => {
    // 1. 0–600 ms: Orbs scale from 0 to 1 in circle formation
    orbScale.value = withTiming(1, { 
      duration: 600, 
      easing: Easing.bezier(0.25, 1, 0.5, 1) 
    });
    orbPositionState.value = withTiming(1, { duration: 600 });

    // 2. 800–1500 ms: Orbs move to vertical straight line
    orbPositionState.value = withDelay(
      800,
      withTiming(2, { 
        duration: 700, 
        easing: Easing.inOut(Easing.cubic) 
      })
    );

    // 3. 1500–1800 ms: Preparation pause + breathing
    orbPulse.value = withDelay(
      1500,
      withRepeat(
        withTiming(1.1, { duration: 400, easing: Easing.inOut(Easing.sin) }),
        2,
        true
      )
    );

    // 4. 1800–2700 ms: Morph to full number "1"
    orbPositionState.value = withDelay(
      1800,
      withTiming(3, { 
        duration: 800, 
        easing: Easing.bezier(0.4, 0, 0.2, 1) 
      })
    );

    // 5. 2500–2800 ms: "So" and "ana" slide in
    textOpacity.value = withDelay(2500, withTiming(1, { duration: 500 }));
    textSlide.value = withDelay(2500, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));

    // 6. Shift group left
    groupTranslateX.value = withDelay(2800, withTiming(-15, { duration: 600, easing: Easing.out(Easing.cubic) }));

    // 7. 3200–3600 ms: "Hub" and Subtitle fade in
    hubOpacity.value = withDelay(3200, withTiming(1, { duration: 400 }));
    subtitleOpacity.value = withDelay(3400, withTiming(1, { duration: 400 }));
    subtitleTranslateY.value = withDelay(3400, withTiming(0, { duration: 500 }));

    // 8. 4200 ms: Complete
    const timer = setTimeout(() => {
      onAnimationComplete?.();
    }, 4200);

    return () => clearTimeout(timer);
  }, []);

  const getOrbStyle = (index: number) => {
    return useAnimatedStyle(() => {
      let x = 0;
      let y = 0;
      let scaleOffset = 1;

      // Positions for different stages
      // Stage 1: Circle (12, 3, 6, 9 o'clock)
      const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
      const circleX = Math.cos(angles[index]) * RADIUS;
      const circleY = Math.sin(angles[index]) * RADIUS;

      // Stage 2: Vertical Line
      const lineY = -40 + index * 26;

      // Stage 3: Morph to "1"
      const oneCoords = [
        { x: -14, y: -28 }, // Serif
        { x: 0, y: -40 },   // Top stem
        { x: 0, y: -10 },   // Mid stem
        { x: 0, y: 20 },    // Bottom stem
      ];

      if (orbPositionState.value <= 1) {
        // Scaling from center to circle
        x = interpolate(orbPositionState.value, [0, 1], [0, circleX]);
        y = interpolate(orbPositionState.value, [0, 1], [0, circleY]);
      } else if (orbPositionState.value <= 2) {
        // Circle to Line
        x = interpolate(orbPositionState.value, [1, 2], [circleX, 0]);
        y = interpolate(orbPositionState.value, [1, 2], [circleY, lineY]);
      } else {
        // Line to "1"
        x = interpolate(orbPositionState.value, [2, 3], [0, oneCoords[index].x]);
        y = interpolate(orbPositionState.value, [2, 3], [lineY, oneCoords[index].y]);
        scaleOffset = interpolate(orbPositionState.value, [2, 3], [1, 1.15]);
      }

      return {
        transform: [
          { translateX: x },
          { translateY: y },
          { scale: orbScale.value * orbPulse.value * scaleOffset }
        ],
        opacity: orbScale.value,
      };
    });
  };

  const soStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateX: interpolate(textSlide.value, [0, 1], [-70, 0]) }],
  }));

  const anaStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateX: interpolate(textSlide.value, [0, 1], [70, 0]) }],
  }));

  const groupStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: groupTranslateX.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.mainGroup, groupStyle]}>
        {/* "So" */}
        <Animated.View style={[styles.glassTextWrapper, soStyle]}>
          <Text style={styles.brandText}>So</Text>
        </Animated.View>

        {/* The "1" (Animated Orbs) */}
        <View style={styles.orbContainer}>
          {[0, 1, 2, 3].map((i) => (
            <Animated.View key={i} style={[styles.orb, getOrbStyle(i)]}>
              <BlurView intensity={Platform.OS === 'web' ? 40 : 80} tint="light" style={styles.orbBlur}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.2)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.specular} />
              </BlurView>
            </Animated.View>
          ))}
        </View>

        {/* "ana" */}
        <Animated.View style={[styles.glassTextWrapper, anaStyle]}>
          <Text style={styles.brandText}>ana</Text>
        </Animated.View>

        {/* "Hub" */}
        <Animated.View style={{ opacity: hubOpacity.value, marginLeft: 12 }}>
          <Text style={styles.hubText}>Hub</Text>
        </Animated.View>
      </Animated.View>

      {/* Footer Subtitle */}
      <Animated.View style={[styles.footer, { opacity: subtitleOpacity.value, transform: [{ translateY: subtitleTranslateY.value }] }]}>
        <Text style={styles.subtitle}>SOLANA IN ONE</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  glassTextWrapper: {
    marginHorizontal: 4,
  },
  brandText: {
    color: '#fff',
    fontSize: 58,
    fontWeight: '800',
    letterSpacing: -2,
    textShadowColor: 'rgba(255,255,255,0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  hubText: {
    color: '#fff',
    fontSize: 58,
    fontWeight: '200',
    letterSpacing: -1,
  },
  orbContainer: {
    width: 40,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  orb: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  orbBlur: {
    flex: 1,
  },
  specular: {
    position: 'absolute',
    top: '15%',
    left: '15%',
    width: '35%',
    height: '35%',
    borderRadius: 10,
    backgroundColor: '#fff',
    opacity: 0.8,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  subtitle: {
    color: '#AAAAAA',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 4,
  },
});
